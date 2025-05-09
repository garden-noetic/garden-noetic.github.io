// Particle-system density and brightness levels
const DENSITY_LEVELS = { low: 5000, medium: 12000, high: 25000 };
const BRIGHTNESS_LEVELS = { low: 0.4, medium: 0.7, high: 1.0 };

// List of available shapes
const shapes = ['Tetrahedron', 'Cube', 'Octahedron', 'Dodecahedron', 'Icosahedron', 'Sphere'];

// Color themes for particles
const colorThemes = {
  gold:    () => new THREE.Color(0xFFA500),
  purple:  () => new THREE.Color(0x9933ff),
  green:   () => new THREE.Color(0x00cc66),
  rainbow: (i, total) => new THREE.Color().setHSL(i/total, 0.9, 0.55)
};

// Fade duration constant for text transitions (milliseconds)
const TEXT_FADE_DURATION = 1000;

// Text presentations and camera segments for each solid
const solidPresentations = {
  "Tetrahedron": [
    {
      title: "The Tetrahedron: Spark of Fire",
      content: "The simplest Platonic Solid, embodying sharpness and mobility. Ancient philosophers, like Plato, linked its pointed form to the element of Fire, seeing it as the fundamental building block of this dynamic force.",
      camera: { position: new THREE.Vector3(0, 0.8, 2.8), target: new THREE.Vector3(0, 0.1, 0) }
    },
    {
      title: "Tetrahedron: Geometric Blueprint",
      content: "Faces: 4 Equilateral Triangles. Vertices: 4 (3 faces meet at each). Edges: 6. Dihedral Angle (between faces): ~70.53°. It is uniquely self-dual – its dual polyhedron is another tetrahedron.",
      camera: { position: new THREE.Vector3(1.8, 1.2, 1.8), target: new THREE.Vector3(0, 0, 0) }
    },
    {
      title: "Tetrahedron: Noetic Resonance",
      content: "Symbolizes balance, the initial point of manifestation, and the power of the trinity unfolding into the first stable 3D form. Its structure is foundational in nature, from molecular bonds to energetic theories.",
      camera: { position: new THREE.Vector3(-0.5, -0.7, 2.5), target: new THREE.Vector3(0, -0.2, 0) }
    }
  ],
  "Cube": [
    {
      title: "The Cube (Hexahedron): Foundation of Earth",
      content: "A symbol of stability and grounding. Plato associated the cube with the element of Earth due to its firm base and ability to sit solidly, representing the material world.",
      camera: { position: new THREE.Vector3(2, 2, 2), target: new THREE.Vector3(0, 0, 0) }
    },
    {
      title: "Cube: Geometric Blueprint",
      content: "Faces: 6 Squares. Vertices: 8 (3 faces meet at each). Edges: 12. Dihedral Angle: 90°. Its dual is the Octahedron. All angles are right angles, making it a cornerstone of rectilinear geometry.",
      camera: { position: new THREE.Vector3(-2, 2, 2), target: new THREE.Vector3(0, 0, 0) }
    },
    {
      title: "Cube: Noetic Resonance",
      content: "Represents order, structure, and divine law manifesting in physical reality. It signifies the framework upon which the tangible world is built, a symbol of integrity and dependable form.",
      camera: { position: new THREE.Vector3(2, -2, 2), target: new THREE.Vector3(0, 0, 0) }
    }
  ],
  "Octahedron": [
    {
      title: "The Octahedron: Crystal of Air",
      content: "Composed of two square pyramids joined at their bases, the Octahedron was linked by Plato to the element of Air, its smooth form allowing it to spin and flow freely.",
      camera: { position: new THREE.Vector3(0, 3, 0), target: new THREE.Vector3(0, 0, 0) }
    },
    {
      title: "Octahedron: Geometric Blueprint",
      content: "Faces: 8 Equilateral Triangles. Vertices: 6 (4 faces meet at each). Edges: 12. Dihedral Angle: ~109.47°. Its dual is the Cube. It can be seen as perfectly balanced and symmetrical.",
      camera: { position: new THREE.Vector3(2.5, 1.5, -1), target: new THREE.Vector3(0, 0, 0) }
    },
    {
      title: "Octahedron: Noetic Resonance",
      content: "Symbolizes integration, the balance of spirit and matter, reflection (as above, so below), and the heart's wisdom. It is often seen as a crystal of healing and perfect equilibrium.",
      camera: { position: new THREE.Vector3(-1.5, 2, -2), target: new THREE.Vector3(0, 0, 0) }
    }
  ],
  "Dodecahedron": [
    {
      title: "The Dodecahedron: Vessel of the Cosmos",
      content: "With its twelve pentagonal faces, Plato considered the Dodecahedron to be the model used by the Creator to arrange the constellations, representing the Universe or Aether itself.",
      camera: { position: new THREE.Vector3(3, 0, 1), target: new THREE.Vector3(0, 0, 0) }
    },
    {
      title: "Dodecahedron: Geometric Blueprint",
      content: "Faces: 12 Regular Pentagons. Vertices: 20 (3 faces meet at each). Edges: 30. Dihedral Angle: ~116.57°. Its dual is the Icosahedron. Contains proportions related to the Golden Ratio.",
      camera: { position: new THREE.Vector3(1, 3, 1), target: new THREE.Vector3(0, 0, 0) }
    },
    {
      title: "Dodecahedron: Noetic Resonance",
      content: "Represents divine thought, universal consciousness, and the interconnectedness of all things. Its form is linked to higher dimensions and the subtle energies that weave through creation.",
      camera: { position: new THREE.Vector3(-1, 1, 3), target: new THREE.Vector3(0, 0, 0) }
    }
  ],
  "Icosahedron": [
    {
      title: "The Icosahedron: Flow of Water",
      content: "The most complex of the Platonic solids in terms of faces, Plato associated the Icosahedron with the element of Water, as it is the solid that would roll and flow most easily.",
      camera: { position: new THREE.Vector3(0, -3, 0), target: new THREE.Vector3(0, 0, 0) }
    },
    {
      title: "Icosahedron: Geometric Blueprint",
      content: "Faces: 20 Equilateral Triangles. Vertices: 12 (5 faces meet at each). Edges: 30. Dihedral Angle: ~138.19°. Its dual is the Dodecahedron. Exhibits a high degree of symmetry and efficiency of form.",
      camera: { position: new THREE.Vector3(2, -1, 2), target: new THREE.Vector3(0, 0, 0) }
    },
    {
      title: "Icosahedron: Noetic Resonance",
      content: "Symbolizes transformation, movement, and the dynamic flow of energy and emotion. It is often associated with creative potential, adaptability, and going with the stream of life.",
      camera: { position: new THREE.Vector3(-2, -1, 2), target: new THREE.Vector3(0, 0, 0) }
    }
  ],
  "Sphere": [
    {
      title: "The Sphere: Unity and Wholeness",
      content: "While not a Platonic Solid (it lacks flat faces and straight edges), the Sphere is the ultimate expression of unity, completeness, and equality in all directions from its center.",
      camera: { position: new THREE.Vector3(0, 0, 4), target: new THREE.Vector3(0, 0, 0) }
    },
    {
      title: "Sphere: Geometric Blueprint",
      content: "A perfectly round geometrical object in three-dimensional space that is the surface of a completely round ball. All points on its surface are equidistant from its center. Infinite rotational symmetry.",
      camera: { position: new THREE.Vector3(3, 0, 0), target: new THREE.Vector3(0, 0, 0) }
    },
    {
      title: "Sphere: Noetic Resonance",
      content: "Represents the void and potentiality, the 'All-That-Is,' totality, and the encompassing nature of consciousness. It is often seen as a symbol of the soul, the cosmos, and boundless being.",
      camera: { position: new THREE.Vector3(0, 3, 0), target: new THREE.Vector3(0, 0, 0) }
    }
  ]
}; 