# Navmesh

Utilizing Unity's powerful navigation mesh system, you can generate a map where your units can move based on the shape of your level. For more information regarding navmesh generation refer to [the Unity documentation](https://docs.unity3d.com/2020.1/Documentation/Manual/nav-BuildingNavMesh.html).

# Pathfinding

The [three-pathfinding](https://github.com/donmccurdy/three-pathfinding) package is very easy to use and accepts any mesh to pathfind on.

# The sample

## Navmesh component

Add the **Navmesh** component to your scene and hit generate. That will both generate the navmesh and export it to obj that is stored in a folder next to your scene. That obj is also added under the navmesh component and referenced.

## Pathfinding API

Basic usage can be found in `NavmeshDemo_Controls.ts` where it queries path between two points.

`Navmesh.FindPath(from, to)` which returns the path as an array of positions: `Vector3[]`.

Please refer to the `three-pathfinding` package for more information.

## Debuging

add `?debugnavmesh` to your url to display the navmesh to better understand what is going on. 

# Unity Navigation package notice
From 2022 onwards Unity has moved the Navmesh to a dedicated package. Make sure to have `com.unity.ai.navigation` in your project.