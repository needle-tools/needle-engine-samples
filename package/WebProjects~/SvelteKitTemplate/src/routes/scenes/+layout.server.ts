export async function load({ params }) {
    // we get params.slug as input here and can decide what to do wit it
    return {
        entries: [
            {
                url: "MyCube",
                name: "Cube",
            },
            {
                url: "MySphere",
                name: "Sphere",
            },
        ]
    };
}