import React from 'react'
import { createRoot } from 'react-dom/client'
import { ShaderGradientCanvas, ShaderGradient } from 'shadergradient'
import * as miniSpring from '@react-spring/three'

function App() {
  return (
    <ShaderGradientCanvas
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
      }}
    >
      <ShaderGradient
        type="waterPlane"
        animate="on"
        uSpeed={0.1}
        uStrength={1.4}
        uDensity={1.3}
        uFrequency={5.5}
        color1="#a40000"
        color2="#ff0000"
        color3="#ffffff"
        bgColor1="#000000"
        bgColor2="#000000"
        brightness={1.1}
        cAzimuthAngle={180}
        cPolarAngle={115}
        cDistance={3.92}
        cameraZoom={1}
        fov={45}
        positionX={-0.5}
        positionY={0.1}
        positionZ={0}
        rotationX={0}
        rotationY={0}
        rotationZ={235}
        grain="off"
        lightType="3d"
        reflection={0.1}
        wireframe={false}
      />
    </ShaderGradientCanvas>
  )
}

const container = document.getElementById('work-gradient-container')
if (container) {
  const root = createRoot(container)
  root.render(<App />)
}
