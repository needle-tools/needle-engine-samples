import { createElement, ReactElement, useEffect, useState } from 'react'
import { useThree } from "@react-three/fiber";
import { Object3D } from 'three';
import { Context, LoadingProgressArgs, build_scene_functions } from 'needle.tiny.engine/engine/engine_setup';
import { GameObject } from 'needle.tiny.engine/engine-components/Component';
import { Camera } from 'needle.tiny.engine/engine-components/Camera';
import { getParam } from 'needle.tiny.engine/engine/engine_utils';

export function NeedleScene (_props : any): ReactElement {
const debug = getParam("debugreact");
  const src = 'loadScene';
  const alias = 'test';
  
  const [state, setState] = useState<{ context?: Context}>({context : undefined});
  const three = useThree();
  
  // componentWillMount
  useEffect(() => {
    const onLoadingCallback = (callback: LoadingProgressArgs) => {
      // console.log(callback.name, callback.progress.loaded / callback.progress.total, callback.index + "/" + callback.count);
      const total = callback.index / callback.count + (callback.progress.loaded / callback.progress.total) / callback.count;
      const percent = (total * 100).toFixed(0) + "%";
      if (debug)
        console.log(percent);
    };

    if (debug)
      console.log(three, three.gl.animate);

    if (!state.context) {
      const newContext = new Context({ name: src, domElement: three.gl.domElement.parentElement, alias: alias, renderer: three.gl });

      if (src && src.length > 0) {
        const fn: (context: Context) => Promise<void> = build_scene_functions[src] ?? window[src];
        if (fn) {
          
          console.log("Begin loading scene", alias);
          newContext.onCreate(fn, { progress: onLoadingCallback })?.then(() =>{
            console.log("End loading scene");
            Context.Current = newContext;
            const comp = GameObject.addNewComponent(three.camera, Camera);
            newContext.mainCamera = three.camera;
            newContext.mainCameraComponent = comp;
          });
        }
        else {
            console.error("Could not find scene function named \"" + src + "\", it must be either in global scope " +
                "or added to build_scene_functions", build_scene_functions);
        }
      } else {
          console.error("Missing src attribute - please provide a function name");
      }

      setState({context: newContext});
      if (debug)
        console.log("CREATING NEW CONTEXT - SHOULD ONLY HAPPEN ONCE", newContext.scene);
    }

    return () => {
      if (debug)
        console.log("will unmount");
    };
  }, []);

  // render
  useEffect(() => {
    if (state.context) {
      (element.props.object as Object3D).add(state.context.scene);
      if (debug)
        console.log("added context scene to root - happens when the component is rendered");
    }
  });

  const root = new Object3D();
  root.name = "Tiny Scene Root";
  const element = createElement(
    'primitive', { object: root }, null
  );
  return element;
}