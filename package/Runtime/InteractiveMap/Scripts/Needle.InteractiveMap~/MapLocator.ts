import { Behaviour, GameObject, OrbitControls, serializable, Camera as NeedleCamera, Gizmos } from "@needle-tools/engine";
import { getWorldPosition } from "@needle-tools/engine";
import { latLongToVector3 as latLongToNormalized } from "./MapView";
import { Vector3, Shape, ShapeGeometry, MeshBasicMaterial, Mesh, DoubleSide, CircleGeometry, Camera } from "three";

// Documentation → https://docs.needle.tools/scripting

export class MapLocator extends Behaviour {

    @serializable()
    refreshInterval: number = 30.0;

    @serializable()
    locateOnEnable: boolean = false;

    @serializable()
    mapParent?: GameObject;
    
    private element?: HTMLElement;
    private styleElement?: HTMLStyleElement;

    private template() {
        return /*html*/`
        <div id="map-ui">
            <button id="locate" style="font-size:2em;">Locate me</button><br/>
            <form id="search"><input type="text" id="searchInfo" placeholder="Enter location"><input type="submit" value="Find"/></form><br/>
            <p id="status"></p>
            <a id="map-link" target="_blank"></a>
        </div>
    `}

    private style() {
        return /*css*/`
        #map-ui {
            position: absolute; 
            left: 10px; 
            top: 10px; 
            z-index: 1000;
        }

        #status, #map-link {
            font-size: 1em;
            font-family: monospace;
        }

        #map-ui button {
            font-size: 2em;
            border-radius: 10px;
            outline: none;
            border: 0;
            background: #fff;
            transition: transform 0.2s;
            box-shadow: 0 0 10px rgba(0,0,0,0.2);
            margin-bottom: 10px;
        }

        #map-ui button:hover {
            transform: scale(1.05);
        }
    `}

    onEnable(): void {
        // spawn the template
        const template = document.createElement("template");
        template.innerHTML = this.template();
        this.element = template.content.firstElementChild!.cloneNode(true) as HTMLElement;
        document.body.prepend(this.element);
        
        this.styleElement = document.createElement("style");
        this.styleElement.innerHTML = this.style();
        this.element.prepend(this.styleElement);

        this.element.querySelector("#locate")?.addEventListener("click", this.geoFindMe.bind(this));
        this.element.querySelector("#search")?.addEventListener("submit", this.showAmenities.bind(this));

        if (this.locateOnEnable) {
            setTimeout(() => {
                this.geoFindMe();
            }, 100);
        }
    }

    onDisable(): void {
        this.element?.remove();
        this.styleElement?.remove();
    }

    private lastMesh?: Mesh;


    async showAmenities(evt) {
        evt.preventDefault();

        const query = (this.element?.querySelector("#searchInfo") as HTMLInputElement).value;
        if (!query) return;

        // x1,y1 x2,y2 -- x is longitude, y is latitude
        // Halle (Saale): 51.474971, 11.946711 to 51.503179, 11.989125
        const viewbox = "11.946711,51.474971,11.989125,51.503179";
        // https://nominatim.openstreetmap.org/search?q=${query}&format=jsonv2&polygon_geojson=1&bounded=1&viewbox=0,0,0,0
        // get next closest residential area from openstreetmap
        const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${query}&format=jsonv2&polygon_geojson=1&bounded=1&viewbox=${viewbox}&limit=100`);
        const data = await response.json();
        console.log("Fetching OpenStreetMap data for", query, data);
        if (!data || !data.length) return;

        for (const result of data) {
            // create a debug line on each latlong
            const lat = parseFloat(result.lat);
            const lon = parseFloat(result.lon);
            const converted = latLongToNormalized(lat, lon);
            // convert to map space
            if (this.mapParent) this.mapParent.localToWorld(converted);
            const up = converted.clone().add(new Vector3(0, 0.2, 0));
            Gizmos.DrawSphere(converted, 0.05, 0xff0000, 10);
            const safeName = result.name.replace(/[^a-z0-9 -.,]/gi, '_');
            Gizmos.DrawLabel(up, safeName, 0.05, 10);
            Gizmos.DrawLine(converted, up, 0xff0000, 10);
        }
    }

    async searchLocation(evt) {
        // prevent page change from form submission
        evt.preventDefault();

        // disable currently ongoing GPS tracking
        if (this.currentWatchId !== undefined) {
            navigator.geolocation.clearWatch(this.currentWatchId);
            this.currentWatchId = undefined;
        }

        const query = (this.element?.querySelector("#searchInfo") as HTMLInputElement).value;
        if (!query) return;

        // ...
        // x1,y1 x2,y2 -- x is longitude, y is latitude
        // Halle (Saale): 51.474971, 11.946711 to 51.503179, 11.989125
        const viewbox = "11.946711,51.474971,11.989125,51.503179";
        // https://nominatim.openstreetmap.org/search?q=${query}&format=jsonv2&polygon_geojson=1&bounded=1&viewbox=0,0,0,0
        // get next closest residential area from openstreetmap
        const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${query}&format=jsonv2&polygon_geojson=1&bounded=1&viewbox=${viewbox}&limit=100`);
        const data = await response.json();
        console.log("Fetching OpenStreetMap data for", query, data);
        if (!data || !data.length) return;

        // get first result that has a boundary
        let result = data.find((d: any) => d.geojson?.type === "Polygon");
        if (!result) {
            result = data[0];
            console.log("no polygon found, using first result", data)
        }

        // move OrbitControls target here
        const orbitControls = GameObject.findObjectOfType(OrbitControls);
        if (!orbitControls) return;

        // parse number
        const lat = parseFloat(result.lat);
        const lon = parseFloat(result.lon);
        const converted = latLongToNormalized(lat, lon);

        this.gameObject.position.copy(converted);
        
        let geometry: ShapeGeometry | undefined = undefined;
        if (result.geojson?.type === "Polygon") {
            // turn the returned polygon into a three.js polygon
            const polygon = new Shape();
            const convertedData:Array<Vector3> = [];
            
            for(const c of result.geojson.coordinates[0]) {
                const res = latLongToNormalized(c[1], c[0]);
                convertedData.push(res);
            }

            polygon.moveTo(convertedData[0].x, convertedData[0].z);
            for (const coord of convertedData) {
                polygon.lineTo(coord.x, coord.z);
            }
            polygon.lineTo(convertedData[0].x, convertedData[0].z);

            // create a mesh from the polygon
            geometry = new ShapeGeometry(polygon);
        }
        else {
            geometry = new CircleGeometry(0.0001 * 10, 32) as unknown as ShapeGeometry;
        }
        
        const material = new MeshBasicMaterial({ color: 0x0000ff, side: DoubleSide, opacity: 0.1, transparent: true });
        const mesh = new Mesh(geometry, material);
        mesh.rotateX(Math.PI / 2);
        mesh.position.y = 0.0;
        if (result.geojson?.type !== "Polygon") {
            mesh.position.copy(converted);
            mesh.scale.z = 0.001;
        }
        this.gameObject.parent!.add(mesh);
        if (this.lastMesh) {
            this.lastMesh.geometry.dispose();
            if (Array.isArray(this.lastMesh.material))
                this.lastMesh.material.forEach(m => m.dispose());
            else
                this.lastMesh.material?.dispose();
            this.lastMesh.parent?.remove(this.lastMesh);
        }
        this.lastMesh = mesh;

        const min = orbitControls.controls!.minDistance;
        const max = orbitControls.controls!.maxDistance;
        orbitControls.fitCamera([mesh]);
        orbitControls.controls!.minDistance = min;
        orbitControls.controls!.maxDistance = max;

        const status = document.querySelector("#status") as HTMLDivElement;
        const mapLink = document.querySelector("#map-link") as HTMLAnchorElement;
        status.innerText = '';
        mapLink.href = ``;
        mapLink.textContent = ``;
    }
    
    private currentWatchId: number | undefined = undefined;
    geoFindMe() {
        const object = this.gameObject;
        const me = this;

        const status = document.querySelector("#status") as HTMLDivElement;
        const mapLink = document.querySelector("#map-link") as HTMLAnchorElement;
        if (!status || !mapLink) return;

        mapLink.href = "";
        mapLink.textContent = "";

        let haveMatchedCameraOnce = false;

        function timestampToTime(timestamp: number) {
            const date = new Date(timestamp);
            return date.toLocaleTimeString();
        }

        function success(position) {
            const latitude = position.coords.latitude;
            const longitude = position.coords.longitude;

            status.textContent = "";
            mapLink.href = `https://www.openstreetmap.org/#map=18/${latitude}/${longitude}`;
            mapLink.innerHTML = `Latitude: ${latitude}°<br/>Longitude: ${longitude}°`;
            status.innerText = `Timestamp: ${timestampToTime(position.timestamp)}\nAccuracy: ${position.coords.accuracy?.toFixed(2)}m\nAltitude: ${position.coords.altitude}, Altitude Accuracy: ${position.coords.altitudeAccuracy?.toFixed(2)}\nHeading: ${position.coords.heading}`;

            const converted = latLongToNormalized(latitude, longitude);
            if (me.mapParent) me.mapParent.localToWorld(converted);
            object.position.copy(converted);
            // console.log("New position data.", position.coords, position.timestamp);
            
            if (!haveMatchedCameraOnce) {
                haveMatchedCameraOnce = true;
                const orbitControls = GameObject.findObjectOfType(OrbitControls)!;
                me.setScale();
                // object.scale.set(0.00001, 0.00001, 0.00001);
                
                const min = orbitControls.controls!.minDistance;
                const max = orbitControls.controls!.maxDistance;
                orbitControls.fitCamera([object]);
                orbitControls.controls!.minDistance = min;
                orbitControls.controls!.maxDistance = max;
            }
        }

        function error(err: GeolocationPositionError) {
            if (err.code === GeolocationPositionError.PERMISSION_DENIED)
                status.textContent = "The request to get your location was denied.";
            else if (err.code === GeolocationPositionError.POSITION_UNAVAILABLE)
                status.textContent = "Location information is unavailable.";
            else if (err.code === GeolocationPositionError.TIMEOUT)
                status.textContent = "The request to get your location timed out.";
            else
                status.textContent = "Unable to retrieve your location";
        }

        if (!navigator.geolocation) {
            status.textContent = "Geolocation is not supported by your browser";
        } else {
            status.textContent = "Locating…";

            // https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API/Using_the_Geolocation_API#fine_tuning_the_response
            const options: PositionOptions = {
                enableHighAccuracy: true,
                maximumAge: this.refreshInterval * 1000,    // in milliseconds
                timeout: 15000, // in milliseconds
            };

            // Only gets position once:
            // navigator.geolocation.getCurrentPosition(success, error, options);

            // Tracks position over time:
            if (this.currentWatchId !== undefined)
                navigator.geolocation.clearWatch(this.currentWatchId);
            this.currentWatchId = navigator.geolocation.watchPosition(success, error, options);
        }
    }

    private cameraWp = new Vector3(); 
    private objectWp = new Vector3();
    onBeforeRender(): void {
        this.setScale();
    }

    setScale() {
        // calculate distance to camera
        const cam = this.context.mainCameraComponent!;

        this.cameraWp.copy(cam.worldPosition);
        getWorldPosition(this.gameObject, this.objectWp);

        const distance = this.cameraWp.distanceTo(this.objectWp);
        const scale = distance * 0.01 * 10;
        this.gameObject.scale.set(scale, scale, scale);

        cam.nearClipPlane = 0.0001 * distance;
        cam.farClipPlane = 1000 * distance;
    }
}