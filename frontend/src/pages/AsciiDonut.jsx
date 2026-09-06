import { useEffect, useRef, useState } from "react"
import { Pause, Play } from "lucide-react"
import * as THREE from "three"
import { AsciiEffect } from "three/addons/effects/AsciiEffect.js"

// The exact luminance ramp from Andy Sloane's original donut.c (2006) — the
// program this is a tribute to. Dimmest first; the leading space is background.
const DONUT_CHARSET = " .,-~:;=!*#$@"

// Radians per second. donut.c spins on two axes at once (it calls them A and B),
// which is what makes the surface appear to flow rather than merely turn.
const SPIN_X = 0.55
const SPIN_Z = 0.9

export function AsciiDonut() {
  const mountRef = useRef(null)

  // Everything Three.js builds, kept out of React state — these are mutable
  // objects that should never trigger a re-render when they change.
  const sceneRef = useRef(null)

  // Autoplay unless the visitor asked the OS for less motion. They still get a
  // button: honouring the preference should mean "don't surprise me", not
  // "you may not see the thing you came for".
  const [isSpinning, setIsSpinning] = useState(
    () => !window.matchMedia("(prefers-reduced-motion: reduce)").matches
  )

  // --- setup: runs once ---------------------------------------------------
  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    // A square canvas sized to the smaller side. The ASCII output is a <table>
    // of text whose real size comes from font metrics, not pixels — let it fill
    // a wide container and it overflows instead of scaling.
    const getSize = () =>
      Math.floor(Math.min(mount.clientWidth, mount.clientHeight) * 0.92)

    const size = getSize()

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x000000)

    const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100)
    camera.position.z = 3.5

    // Directional lights do not fall off with distance, so brightness stays
    // predictable. The angle is what carves the shading the characters read
    // from — with flat lighting every cell picks the same character.
    const keyLight = new THREE.DirectionalLight(0xffffff, 3)
    keyLight.position.set(-2.5, 3, 3)
    scene.add(keyLight)

    const fillLight = new THREE.DirectionalLight(0xffffff, 0.6)
    fillLight.position.set(3, -2, 1.5)
    scene.add(fillLight)

    scene.add(new THREE.AmbientLight(0xffffff, 0.25))

    // radius, tube thickness, then segments around each ring
    const geometry = new THREE.TorusGeometry(1.15, 0.48, 28, 72)
    const material = new THREE.MeshPhongMaterial({
      color: 0xffffff,
      specular: 0x333333,
      shininess: 18,
    })
    const donut = new THREE.Mesh(geometry, material)
    scene.add(donut)

    // The WebGL renderer draws normally, then AsciiEffect reads those pixels,
    // measures each cell's brightness and prints a character of matching weight.
    // The canvas is never shown — the output is a <table> of text.
    const renderer = new THREE.WebGLRenderer({ antialias: false })
    renderer.setSize(size, size)

    const effect = new AsciiEffect(renderer, DONUT_CHARSET, {
      // invert maps BRIGHT pixels to the dense characters. Without it you get
      // the opposite ramp, which only reads correctly as dark text on white.
      invert: true,
      resolution: 0.2,
    })
    effect.setSize(size, size)
    effect.domElement.style.color = "#d8b4fe"
    effect.domElement.style.backgroundColor = "#000000"
    mount.appendChild(effect.domElement)

    sceneRef.current = { scene, camera, effect, donut, clock: new THREE.Clock() }

    // draw one frame immediately so there is something on screen even if paused
    effect.render(scene, camera)

    const handleResize = () => {
      const nextSize = getSize()
      effect.setSize(nextSize, nextSize)
      effect.render(scene, camera)
    }

    window.addEventListener("resize", handleResize)

    // Three.js allocates GPU memory that garbage collection cannot reach, so it
    // has to be released by hand. React 19 StrictMode runs effects twice in
    // development — without this you would end up with two donuts.
    return () => {
      window.removeEventListener("resize", handleResize)

      if (effect.domElement.parentNode === mount) {
        mount.removeChild(effect.domElement)
      }

      geometry.dispose()
      material.dispose()
      renderer.dispose()
      sceneRef.current = null
    }
  }, [])

  // --- animation: starts and stops with the button ------------------------
  useEffect(() => {
    if (!isSpinning) return

    const context = sceneRef.current
    if (!context) return

    const { scene, camera, effect, donut, clock } = context

    // flush whatever time accumulated while paused, so it does not jump
    clock.getDelta()

    let frameId = null

    const renderFrame = () => {
      frameId = requestAnimationFrame(renderFrame)

      // delta time, not a fixed increment — otherwise the spin speed would
      // change with the monitor's refresh rate
      const delta = clock.getDelta()
      donut.rotation.x += SPIN_X * delta
      donut.rotation.z += SPIN_Z * delta

      effect.render(scene, camera)
    }

    renderFrame()

    return () => {
      if (frameId !== null) cancelAnimationFrame(frameId)
    }
  }, [isSpinning])

  return (
    <div className="flex min-h-svh flex-col bg-black text-white">
      <header className="flex items-center justify-between gap-4 border-b border-white/10 px-6 py-4">
        <div>
          <h1 className="font-display text-xl tracking-tight">ASCII Donut</h1>
          <p className="mt-1 text-xs text-white/40">
            Three.js torus, rendered as text
          </p>
        </div>

        <div className="flex items-center gap-5">
          <button
            type="button"
            onClick={() => setIsSpinning((spinning) => !spinning)}
            className="inline-flex items-center gap-2 border border-white/20 px-3 py-1.5 text-xs text-white/80 transition-colors hover:border-white/40 hover:text-white focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:outline-none"
          >
            {isSpinning ? (
              <>
                <Pause className="size-3.5" /> Pause
              </>
            ) : (
              <>
                <Play className="size-3.5" /> Spin
              </>
            )}
          </button>

          <a
            href="#/"
            className="text-xs text-white/50 underline-offset-4 hover:text-white hover:underline"
          >
            ← back to the app
          </a>
        </div>
      </header>

      <div
        ref={mountRef}
        className="flex min-h-0 flex-1 items-center justify-center overflow-hidden"
      />

      <footer className="border-t border-white/10 px-6 py-4 text-xs leading-relaxed text-white/40">
        A real 3D torus is lit and rendered off-screen every frame. Each cell of
        the output grid is measured for brightness and swapped for a character of
        matching weight — dark to light along{" "}
        <code className="text-white/70">{DONUT_CHARSET.trim()}</code>, the ramp
        from Andy Sloane's donut.c.
      </footer>
    </div>
  )
}
