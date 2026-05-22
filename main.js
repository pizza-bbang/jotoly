import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

document.addEventListener('DOMContentLoaded', () => {
    initLidarView();
    initTelemetry();
    initControls();
    startClock();
});

// --- 3D LiDAR Visualization ---
function initLidarView() {
    const container = document.getElementById('lidar-canvas-container');
    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    
    renderer.setSize(width, height);
    container.appendChild(renderer.domElement);

    // Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    camera.position.set(20, 20, 20);
    controls.update();

    // Grid Helper
    const gridHelper = new THREE.GridHelper(50, 50, 0x00ffff, 0x222222);
    scene.add(gridHelper);

    // Simulated Point Cloud
    const particleCount = 10000;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const color = new THREE.Color();

    for (let i = 0; i < particleCount; i++) {
        // Create a simulated environment (box + some randomness)
        const x = (Math.random() - 0.5) * 40;
        const y = Math.random() * 10;
        const z = (Math.random() - 0.5) * 40;

        positions[i * 3] = x;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = z;

        // Color based on height (Y axis)
        color.setHSL(0.5 + (y / 15), 1.0, 0.5);
        colors[i * 3] = color.r;
        colors[i * 3 + 1] = color.g;
        colors[i * 3 + 2] = color.b;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
        size: 0.1,
        vertexColors: true,
        transparent: true,
        opacity: 0.8
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);

    // Animation Loop
    function animate() {
        requestAnimationFrame(animate);
        
        // Slight rotation to show it is dynamic
        points.rotation.y += 0.001;
        
        controls.update();
        renderer.render(scene, camera);
    }

    animate();

    // Handle Resize
    window.addEventListener('resize', () => {
        const newWidth = container.clientWidth;
        const newHeight = container.clientHeight;
        camera.aspect = newWidth / newHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(newWidth, newHeight);
    });
}

// --- Telemetry & Diagnostics ---
function initTelemetry() {
    const batVal = document.getElementById('bat-val');
    const tempVal = document.getElementById('temp-val');
    const gpuLoad = document.getElementById('gpu-load');
    const eventLog = document.getElementById('event-log');

    setInterval(() => {
        // Simulate fluctuating values
        const bat = (95 + Math.random() * 3).toFixed(1);
        const temp = (40 + Math.random() * 5).toFixed(1);
        const gpu = (10 + Math.random() * 5).toFixed(0);

        batVal.textContent = `${bat}%`;
        tempVal.textContent = `${temp}°C`;
        gpuLoad.textContent = `${gpu}%`;

        // Random log entries
        if (Math.random() > 0.95) {
            addLogEntry('OBSTACLE DETECTED // REROUTING...');
        }
    }, 2000);
}

function addLogEntry(msg) {
    const eventLog = document.getElementById('event-log');
    const now = new Date();
    const timeStr = `[${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}]`;
    
    const entry = document.createElement('div');
    entry.className = 'log-entry';
    entry.textContent = `${timeStr} ${msg}`;
    
    eventLog.prepend(entry);
    if (eventLog.children.length > 20) eventLog.lastChild.remove();
}

// --- Controls ---
function initControls() {
    const startBtn = document.querySelector('.btn-action.start');
    const stopBtn = document.querySelector('.btn-action.stop');
    const taskName = document.getElementById('task-name');

    startBtn.addEventListener('click', () => {
        taskName.textContent = 'AUTONOMOUS_INSPECTION_ACTIVE';
        taskName.style.color = 'var(--color-success)';
        addLogEntry('MISSION STARTED: AREA_ALPHA_01');
    });

    stopBtn.addEventListener('click', () => {
        taskName.textContent = 'EMERGENCY_HALT';
        taskName.style.color = 'var(--color-danger)';
        addLogEntry('EMERGENCY STOP TRIGGERED BY OPERATOR');
    });

    // PTZ Controls Simulation
    document.querySelectorAll('.ctrl-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            addLogEntry(`PTZ COMMAND: MOVE_${btn.textContent}`);
        });
    });
}

function startClock() {
    const clock = document.getElementById('clock');
    setInterval(() => {
        const now = new Date();
        clock.textContent = now.toLocaleTimeString('ko-KR', { hour12: false });
    }, 1000);
}

