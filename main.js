import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

let scene, camera, renderer, controls, robot;
let controlMode = 'auto'; // 'auto' or 'manual'
let isMissionActive = false;
let currentWaypointIndex = 0;
let waypoints = [
    { x: 10, z: 10, task: 'THERMAL_SCAN' },
    { x: -10, z: 15, task: 'PTZ_INSPECTION' },
    { x: -15, z: -10, task: 'DATA_COLLECTION' },
    { x: 5, z: -15, task: 'AREA_SWEEP' },
    { x: 0, z: 0, task: 'DOCKING' }
];
let isPerformingTask = false;
let moveSpeed = 0.1;
let rotateSpeed = 0.05;

const keys = { w: false, a: false, s: false, d: false };

document.addEventListener('DOMContentLoaded', () => {
    init3D();
    initTelemetry();
    initUI();
    startClock();
    
    window.addEventListener('keydown', (e) => handleKey(e.key.toLowerCase(), true));
    window.addEventListener('keyup', (e) => handleKey(e.key.toLowerCase(), false));
});

function handleKey(key, isPressed) {
    if (keys.hasOwnProperty(key)) keys[key] = isPressed;
}

// --- 3D Scene Setup ---
function init3D() {
    const container = document.getElementById('lidar-canvas-container');
    const width = container.clientWidth;
    const height = container.clientHeight;

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    
    renderer.setSize(width, height);
    container.appendChild(renderer.domElement);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    camera.position.set(25, 25, 25);
    controls.update();

    // Environment
    const gridHelper = new THREE.GridHelper(100, 100, 0x00ffff, 0x222222);
    scene.add(gridHelper);

    // Simple Map: Pillars
    const pillarGeo = new THREE.BoxGeometry(2, 10, 2);
    const pillarMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
    [
        {x: 15, z: 15}, {x: -15, z: 20}, {x: 20, z: -10}, {x: -20, z: -20}
    ].forEach(pos => {
        const p = new THREE.Mesh(pillarGeo, pillarMat);
        p.position.set(pos.x, 5, pos.z);
        scene.add(p);
    });

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(10, 20, 10);
    scene.add(directionalLight);

    createRobot();
    animate();

    window.addEventListener('resize', () => {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    });
}

function createRobot() {
    robot = new THREE.Group();
    
    // Body
    const bodyGeo = new THREE.BoxGeometry(2, 1, 3);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x444444 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    robot.add(body);

    // Head/Sensor (Front is +Z)
    const headGeo = new THREE.BoxGeometry(1.5, 0.8, 1);
    const headMat = new THREE.MeshStandardMaterial({ color: 0x666666 });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.set(0, 0.2, 1.8);
    robot.add(head);

    // Legs (Simplified)
    const legGeo = new THREE.BoxGeometry(0.4, 1.5, 0.4);
    const legMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
    
    const legPositions = [
        {x: 0.8, y: -0.8, z: 1.2}, {x: -0.8, y: -0.8, z: 1.2},
        {x: 0.8, y: -0.8, z: -1.2}, {x: -0.8, y: -0.8, z: -1.2}
    ];

    legPositions.forEach(pos => {
        const leg = new THREE.Mesh(legGeo, legMat);
        leg.position.set(pos.x, pos.y, pos.z);
        robot.add(leg);
    });

    robot.position.y = 1.5;
    scene.add(robot);
}

// --- Animation Loop ---
function animate() {
    requestAnimationFrame(animate);

    if (controlMode === 'auto' && isMissionActive && !isPerformingTask) {
        updateAutoNavigation();
    } else if (controlMode === 'manual') {
        updateManualControl();
    }

    controls.update();
    renderer.render(scene, camera);
}

function updateAutoNavigation() {
    const target = waypoints[currentWaypointIndex];
    const dx = target.x - robot.position.x;
    const dz = target.z - robot.position.z;
    const distance = Math.sqrt(dx * dx + dz * dz);

    if (distance < 0.5) {
        performTask(target.task);
        return;
    }

    // Rotation towards target
    const targetAngle = Math.atan2(dx, dz);
    let angleDiff = targetAngle - robot.rotation.y;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;

    if (Math.abs(angleDiff) > 0.1) {
        robot.rotation.y += Math.sign(angleDiff) * rotateSpeed;
    } else {
        // Move forward
        robot.position.x += Math.sin(robot.rotation.y) * moveSpeed;
        robot.position.z += Math.cos(robot.rotation.y) * moveSpeed;
    }
}

function updateManualControl() {
    if (keys.w) {
        robot.position.x += Math.sin(robot.rotation.y) * moveSpeed;
        robot.position.z += Math.cos(robot.rotation.y) * moveSpeed;
    }
    if (keys.s) {
        robot.position.x -= Math.sin(robot.rotation.y) * moveSpeed;
        robot.position.z -= Math.cos(robot.rotation.y) * moveSpeed;
    }
    if (keys.a) {
        robot.rotation.y += rotateSpeed;
    }
    if (keys.d) {
        robot.rotation.y -= rotateSpeed;
    }
}

function performTask(task) {
    isPerformingTask = true;
    const taskName = document.getElementById('task-name');
    taskName.textContent = \`EXECUTING: \${task}\`;
    taskName.style.color = 'var(--color-warning)';
    addLogEntry(\`TASK START: \${task}\`);

    // Simulate task duration
    setTimeout(() => {
        isPerformingTask = false;
        currentWaypointIndex = (currentWaypointIndex + 1) % waypoints.length;
        addLogEntry(\`TASK COMPLETE: \${task}. MOVING TO NEXT WAYPOINT.\`);
    }, 3000);
}

// --- Telemetry & UI ---
function initTelemetry() {
    const batVal = document.getElementById('bat-val');
    const tempVal = document.getElementById('temp-val');
    const gpuLoad = document.getElementById('gpu-load');

    setInterval(() => {
        const bat = (90 + Math.random() * 5).toFixed(1);
        const temp = (45 + Math.random() * 5).toFixed(1);
        const gpu = (isMissionActive ? 40 : 15 + Math.random() * 5).toFixed(0);

        batVal.textContent = \`\${bat}%\`;
        tempVal.textContent = \`\${temp}°C\`;
        gpuLoad.textContent = \`\${gpu}%\`;
    }, 2000);
}

function initUI() {
    const modeAuto = document.getElementById('mode-auto');
    const modeManual = document.getElementById('mode-manual');
    const manualHint = document.getElementById('manual-hint');
    const startBtn = document.querySelector('.btn-action.start');
    const stopBtn = document.querySelector('.btn-action.stop');
    const taskName = document.getElementById('task-name');

    modeAuto.addEventListener('click', () => {
        controlMode = 'auto';
        modeAuto.classList.add('active');
        modeManual.classList.remove('active');
        manualHint.classList.add('hidden');
        addLogEntry('CONTROL MODE: AUTONOMOUS');
    });

    modeManual.addEventListener('click', () => {
        controlMode = 'manual';
        modeManual.classList.add('active');
        modeAuto.classList.remove('active');
        manualHint.classList.remove('hidden');
        isMissionActive = false;
        taskName.textContent = 'MANUAL_OVERRIDE';
        addLogEntry('CONTROL MODE: MANUAL OVERRIDE ACTIVATED');
    });

    startBtn.addEventListener('click', () => {
        if (controlMode === 'auto') {
            isMissionActive = true;
            addLogEntry('MISSION STARTED');
        } else {
            addLogEntry('ERROR: CANNOT START AUTO MISSION IN MANUAL MODE');
        }
    });

    stopBtn.addEventListener('click', () => {
        isMissionActive = false;
        taskName.textContent = 'EMERGENCY_HALT';
        taskName.style.color = 'var(--color-danger)';
        addLogEntry('EMERGENCY STOP TRIGGERED');
    });
}

function addLogEntry(msg) {
    const eventLog = document.getElementById('event-log');
    const now = new Date();
    const timeStr = \`[\${now.getHours().toString().padStart(2, '0')}:\${now.getMinutes().toString().padStart(2, '0')}:\${now.getSeconds().toString().padStart(2, '0')}]\`;
    const entry = document.createElement('div');
    entry.className = 'log-entry';
    entry.textContent = \`\${timeStr} \${msg}\`;
    eventLog.prepend(entry);
    if (eventLog.children.length > 20) eventLog.lastChild.remove();
}

function startClock() {
    const clock = document.getElementById('clock');
    setInterval(() => {
        const now = new Date();
        clock.textContent = now.toLocaleTimeString('ko-KR', { hour12: false });
    }, 1000);
}
