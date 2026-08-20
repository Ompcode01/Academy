
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';


// Main application class
class CarViewer {
    constructor() {
        this.container = document.getElementById('canvas-container');
        this.infoElement = document.getElementById('info');
        console.log(questionData);
        // Scene setup
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);

        // Set camera position closer to the car and higher up
        this.camera.position.set(0.5, 0.3, 0.35);

        // Renderer setup
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        // Updated encoding properties to match newer Three.js versions
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.0;
        this.container.appendChild(this.renderer.domElement);

        // Target point - the center of the car (important for proper orbiting)
        this.carCenter = new THREE.Vector3(0, 0.1, 0);

        // Controls setup - target the car center for proper zoom behavior
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.maxPolarAngle = Math.PI / 2;
        this.controls.minDistance = 0.1; // Allow closer zoom
        this.controls.maxDistance = 2;   // Limit zoom out
        this.controls.target.copy(this.carCenter); // Set orbit center to car center
        this.controls.addEventListener('change', () => this.updateHotspotPosition());

        // Enable auto rotation for a nice presentation effect when idle
        this.controls.autoRotate = false;  // Can be set to true for auto-rotation
        this.controls.autoRotateSpeed = 0.5;

        // PMREM Generator setup (before environment loading)
        this.pmremGenerator = new THREE.PMREMGenerator(this.renderer);
        this.pmremGenerator.compileEquirectangularShader();

        // Setup lights, environment, and model
        this.setupLights();
        this.setupEnvironment();
        this.loadModel();

        // Hotspot data - positioned to overlay directly on car body
        this.hotspots = [];
        hotspotInfoData.forEach(function (val, i) {
            hotspotInfoData[i].position = new THREE.Vector3(val.position[0], val.position[1], val.position[2]);
        });
        this.hotspotData = hotspotInfoData;

        this.activeHotspot = null;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();

        // Event listeners
        window.addEventListener('resize', () => this.onWindowResize());
        window.addEventListener('click', (event) => this.onClick(event));

        // Start animation loop
        this.animate();
        this.player = typeof window.parent.GetPlayer === 'function' ? window.parent.GetPlayer() : this.nonPlayer;
        console.log("val From Storyline", this.player.GetVar("result"));
    }
    nonPlayer = {
        // this is just for handaling error
        SetVar(key, val) {
            console.log("SET: Storyline Player Not Found: ", key, val);
        },
        GetVar(val) {
            console.log("GET: Storyline Player Not Found: ", val);
        }
    }

    setupLights() {
        // Bright daylight ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.7); // Brighter ambient light for daytime
        this.scene.add(ambientLight);

        /* const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
        directionalLight.position.set(5, 10, 7.5);
        directionalLight.castShadow = true;
        this.scene.add(directionalLight); */

        // Strong directional light simulating sun
        const dirLight = new THREE.DirectionalLight(0xfffaf0, 1.2); // Warm sunlight color, increased intensity
        dirLight.position.set(5, 15, 7.5); // Higher sun position
        dirLight.castShadow = true;
        dirLight.shadow.mapSize.width = 2048;
        dirLight.shadow.mapSize.height = 2048;
        dirLight.shadow.camera.left = -10;
        dirLight.shadow.camera.right = 10;
        dirLight.shadow.camera.top = 10;
        dirLight.shadow.camera.bottom = -10;
        this.scene.add(dirLight);

        // Secondary fill light (softer)
        const fillLight = new THREE.DirectionalLight(0xd6ebff, 0.5); // Slight blue tint for sky reflection
        fillLight.position.set(-5, 3, 0);
        this.scene.add(fillLight);






    }

    setupEnvironment() {
        // Set background color to bright sky blue
        this.scene.background = new THREE.Color(0x87ceeb); // Sky blue background

        // Load HDR environment map
        const rgbeLoader = new RGBELoader();

        rgbeLoader.load('./assets/2019_lbworks_bmw_i8_ver.2/textures/venice_sunset_1k.hdr', (texture) => {
            const envMap = this.pmremGenerator.fromEquirectangular(texture).texture;
            this.scene.environment = envMap;
            texture.dispose();
            this.pmremGenerator.dispose();
        });
    }

    loadModel() {
        const loader = new GLTFLoader();

        // Show loading feedback here if needed

        loader.load('./assets/2019_lbworks_bmw_i8_ver.2/2019_lbworks_bmw_i8_ver.2.gltf', (gltf) => {
            this.model = gltf.scene;

            // Scale and position the model properly
            this.model.scale.set(7.0, 7.0, 7.0); // Keep large scale
            this.model.position.y = 0.1; // Raise the car higher in the view

            // Enhance materials
            this.model.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;

                    // Make glass transparent if needed
                    if (child.material && child.material.name &&
                        (child.material.name.toLowerCase().includes('glass') ||
                            child.material.name.toLowerCase().includes('window'))) {
                        child.material.transparent = true;
                        child.material.opacity = 0.3;
                    }
                }
            });

            this.scene.add(this.model);
            this.addHotspots();

        }, undefined, (error) => {
            console.error('An error occurred loading the model:', error);
        });
    }

    addHotspots() {
        this.hotspotData.forEach(data => {
            // Create even smaller hotspot geometry
            const geometry = new THREE.SphereGeometry(0.007, 16, 16); // Very small size
            const material = new THREE.MeshBasicMaterial({
                color: data.color,
                transparent: true,
                opacity: 0.9
            });

            // Create pulsing effect
            const pulsingMaterial = new THREE.MeshBasicMaterial({
                color: data.color,
                transparent: true,
                opacity: 0.3
            });

            // Create main hotspot
            const hotspot = new THREE.Mesh(geometry, material);
            hotspot.position.copy(data.position);
            hotspot.userData.label = data.label;
            hotspot.userData.color = data.color;
            hotspot.userData.question = data.question || false;

            // Create smaller pulsing sphere
            const pulseGeometry = new THREE.SphereGeometry(0.01, 16, 16); // Smaller pulse effect
            const pulseSphere = new THREE.Mesh(pulseGeometry, pulsingMaterial);
            pulseSphere.userData.pulse = true;
            pulseSphere.userData.initialScale = 1.0;
            pulseSphere.position.copy(data.position);

            this.scene.add(hotspot);
            this.scene.add(pulseSphere);

            this.hotspots.push(hotspot);
            hotspot.userData.pulseEffect = pulseSphere;
        });
    }

    onClick(event) {
        // Calculate mouse position in normalized device coordinates
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        // Set up the raycaster
        this.raycaster.setFromCamera(this.mouse, this.camera);

        // Check for intersections with hotspots
        const intersects = this.raycaster.intersectObjects(this.hotspots);

        if (intersects.length > 0) {
            const hotspot = intersects[0].object;

            // Set hotspot active
            this.activeHotspot = hotspot;

            // Update info label
            this.infoElement.innerHTML = hotspot.userData.label;

            // Set label color based on hotspot color
            const hexColor = '#' + hotspot.userData.color.toString(16).padStart(6, '0');
            this.infoElement.style.borderLeftColor = hexColor;

            // Show the label
            this.infoElement.style.opacity = '1';
            this.updateHotspotPosition();

            // Set a variable in Storyline
            this.player.SetVar("result", "5");
        } else {
            if (!this.activeHotspot?.userData.question) {
                // Hide label when clicking elsewhere
                this.activeHotspot = null;
                this.infoElement.style.opacity = '0';
            }
        }
    }

    updateHotspotPosition() {
        if (this.activeHotspot && !this.activeHotspot.userData.question) {
            // Convert 3D position to screen coordinates
            const position = this.activeHotspot.position.clone();
            const vector = position.project(this.camera);

            // Calculate screen position
            const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
            const y = (-vector.y * 0.5 + 0.5) * window.innerHeight;

            // Position label with offset
            this.infoElement.style.left = `${x + 15}px`;
            this.infoElement.style.top = `${y}px`;

            // Check if hotspot is behind camera
            const isBehindCamera = this.isPointBehindCamera(
                this.activeHotspot.position.clone(),
                this.camera
            );

            // Toggle visibility based on camera position
            this.infoElement.style.opacity = isBehindCamera ? '0' : '1';
        }
    }

    isPointBehindCamera(point, camera) {
        const cameraDirection = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
        const pointDirection = point.clone().sub(camera.position).normalize();
        return cameraDirection.dot(pointDirection) < 0;
    }

    onWindowResize() {
        // Update camera aspect ratio
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();

        // Update renderer size
        this.renderer.setSize(window.innerWidth, window.innerHeight);

        // Update hotspot positions
        this.updateHotspotPosition();
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        // Update controls
        this.controls.update();

        // Animate pulsing effect for hotspots
        this.hotspots.forEach(hotspot => {
            if (hotspot.userData.pulseEffect) {
                const pulse = hotspot.userData.pulseEffect;
                pulse.scale.x = 1 + 0.3 * Math.sin(Date.now() * 0.003);
                pulse.scale.y = 1 + 0.3 * Math.sin(Date.now() * 0.003);
                pulse.scale.z = 1 + 0.3 * Math.sin(Date.now() * 0.003);

                // Update pulse opacity for fade effect
                pulse.material.opacity = 0.3 + 0.1 * Math.sin(Date.now() * 0.003);
            }
        });

        // Render scene
        this.renderer.render(this.scene, this.camera);
    }
}

// Initialize the application
const app = new CarViewer();