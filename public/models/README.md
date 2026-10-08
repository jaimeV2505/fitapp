# Anatomy model for the 3D body

Put a binary glTF here named **`anatomy.glb`** and the Progress screen uses it automatically (nothing to change in
the code). Without the file, a stylised body made of simple shapes is drawn instead.

## What the app needs from the model

- **Binary glTF 2.0 (.glb), not compressed with Draco.** Y axis up (Blender's default export).
- **One mesh per muscle (or per muscle region), named so the app can tell which muscle it is.** Either:
  - our names: `muscle_chest_L`, `muscle_back`, `muscle_quads_R`, `muscle_core`... (groups: chest, back, shoulders,
    biceps, triceps, forearms, quads, hamstrings, glutes, calves, adductors, core), or
  - common anatomical names, which are recognised as they are: *Pectoralis major*, *Rectus femoris*, *Gluteus maximus*,
    *Gastrocnemius*, *Latissimus dorsi*, *Deltoid*, *Rectus abdominis*, *Biceps brachii*, *Biceps femoris*...
  Meshes that match nothing (skeleton, skin) are drawn in a neutral tone.
- **Light enough for a phone:** under about 80,000 triangles and a file of 1 to 3 MB. Over 6 MB is flagged.
- The model is scaled to the body height and centred automatically.

## Check it before you add it

```
pnpm model:check path/to/anatomy.glb
```

It lists which of the 12 muscle groups the model covers, the names it does not recognise, and which muscles would never
light up. Fix the names in Blender (select the object, press F2) and run it again.

## Where to get a model, and licences

Look for one that allows use in a commercial application, and read the licence yourself (this is not legal advice):

- **Z-Anatomy** and **BodyParts3D** are open projects under *CC BY-SA*: free, but they require attribution and that
  adaptations keep the same licence. Put the credit text in `MODEL_CREDIT` in
  `src/modules/analytics/components/body3d/config.ts` and it is shown under the 3D view.
- Avoid anything marked *NonCommercial*.
- A paid model (Sketchfab, TurboSquid, CGTrader) works too if its licence covers use in an app and redistribution of the
  file inside it.

## Preparing it in Blender (free)

1. Import the model. Delete what you do not need (skeleton, organs, skin) to reduce the size.
2. Join the many small muscles of a region into one object per muscle group (Ctrl+J) and name it `muscle_<group>`; or keep
   them separate if their names are anatomical, they are matched one by one.
3. *Modifiers > Decimate* to bring the triangle count down.
4. *File > Export > glTF 2.0 (.glb)*, with *Compression* switched off.
5. `pnpm model:check`, then copy the file here as `anatomy.glb` and commit it.
