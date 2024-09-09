import { Behaviour, DragControls, Mathf, ObjectRaycaster, ObjectUtils, PointerEventData, Rigidbody, SphereCollider } from "@needle-tools/engine";
import { FaceMeshBehaviour, FaceMeshTexture } from "../facemesh/FaceMeshBehaviour";
import { Color } from "three";



// export class FaceSticker extends Behaviour {

//     private facemesh: FaceMeshBehaviour | null = null;

//     onEnable(): void {
//         window.addEventListener("pointerup", this.onPointerUp);
//     }
//     onDisable(): void {
//         window.removeEventListener("pointerup", this.onPointerUp);
//     }

//     onPointerUp = () => {
//         this.facemesh ??= this.gameObject.getComponentInParent(FaceMeshBehaviour);
//         if (this.facemesh) {
//             const hits = this.context.physics.raycast({ useAcceleratedRaycast: false, precise: false });
//             const hit = hits[0];
//             // console.log(hits.length, hit, ...hits.splice(0, 20));
//             if (hit) {
//                 const obj = hit.object;
//                 console.log("Hit face mesh", obj);
//                 const ball = ObjectUtils.createPrimitive("Sphere", {
//                     parent: this.context.scene,
//                     color: new Color(0xffffff * Math.random()),
//                 }
//                 );
//                 ball.scale.multiplyScalar(Mathf.random(.005, .02))
//                 ball.position.copy(hit.point);
//                 obj.attach(ball);

//                 // ball.addComponent(DragControls);

//                 // ball.addComponent(SphereCollider);
//                 // const rb = ball.addComponent(Rigidbody);
//                 // // rb.isKinematic = true;
//                 // rb.gravityScale = Mathf.random(0.01, .1);
//                 // rb.mass = 1;
//             }
//             // console.log(obj, hit.object, this.facemesh.mesh)
//         }
//     }


// }