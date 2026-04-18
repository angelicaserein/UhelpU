/**
 * LevelDataFormat.js
 * User-created Level JSON Schema and Documentation
 *
 * This file documents the JSON format used to store and transmit user-created levels.
 * It is NOT executable code—only specifications and examples.
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * JSON SCHEMA OVERVIEW
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * A user-created level is serialized as a JSON object containing metadata,
 * entity definitions, and room layout information.
 *
 * Example:
 * ────────
 *
 * {
 *   "meta": {
 *     "id": "level_1723456789123",          // Unique ID (e.g., Date.now())
 *     "title": "My First Level",            // User-given name
 *     "authorName": "Alice",                // Creator's name
 *     "createdAt": "2024-12-11T10:30:00Z"   // ISO 8601 timestamp
 *   },
 *   "roomCount": 1,
 *   "canvasWidth": 1366,
 *   "canvasHeight": 768,
 *   "spawn": {
 *     "x": 100,                             // Player spawn x
 *     "y": 400,                             // Player spawn y
 *     "w": 40,                              // Player width
 *     "h": 40                               // Player height
 *   },
 *   "entities": [
 *     // Entity array (see ENTITY TYPES below)
 *   ],
 *   "rooms": [
 *     // Room definitions (optional for single-room levels)
 *   ]
 * }
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * ENTITY TYPES & PARAMETERS
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * SIMPLE STATIC ENTITIES
 * ──────────────────────
 *
 * 1. Ground
 *    ────────
 *    { "type": "Ground", "x": 0, "y": 700, "w": 1366, "h": 68 }
 *    - The level floor (or any static surface)
 *    - Parameters: x, y, w, h
 *
 * 2. Wall
 *    ────
 *    { "type": "Wall", "x": 0, "y": 0, "w": 20, "h": 768 }
 *    - Solid vertical or horizontal walls
 *    - Parameters: x, y, w, h
 *
 * 3. Platform
 *    ────────
 *    { "type": "Platform", "x": 400, "y": 300, "w": 160, "h": 30 }
 *    - Walkable platform (non-solid sides in some designs)
 *    - Parameters: x, y, w, h
 *
 * 4. Box
 *    ───
 *    { "type": "Box", "x": 300, "y": 200, "w": 40, "h": 40 }
 *    - Pushable/interactive box
 *    - Parameters: x, y, w, h
 *
 * 5. Spike
 *    ─────
 *    { "type": "Spike", "x": 200, "y": 80, "w": 100, "h": 20 }
 *    - Hazard that kills the player on contact
 *    - Parameters: x, y, w, h
 *
 * 6. Portal
 *    ──────
 *    { "type": "Portal", "x": 1200, "y": 80, "w": 50, "h": 50, "open": true }
 *    - Level exit/transition point
 *    - Parameters: x, y, w, h, open (boolean, defaults to false)
 *    - If open=true, portal is active at level start
 *
 * 7. Checkpoint
 *    ──────────
 *    { "type": "Checkpoint", "x": 400, "y": 80, "w": 40, "h": 70 }
 *    - Save point for the player
 *    - Parameters: x, y, w, h
 *
 * 8. TeleportPoint
 *    ──────────────
 *    { "type": "TeleportPoint", "x": 500, "y": 80, "w": 40, "h": 70 }
 *    - Teleportation destination/trigger
 *    - Parameters: x, y, w, h
 *
 * 9. TextPrompt
 *    ──────────
 *    { "type": "TextPrompt", "x": 400, "y": 200, "w": 40, "h": 40, "text": "Use arrow keys" }
 *    - On-screen instruction or dialogue text
 *    - Parameters: x, y, w, h, text (string)
 *
 *
 * DYNAMIC ENTITIES
 * ────────────────
 *
 * 10. Enemy
 *     ─────
 *     { "type": "Enemy", "x": 600, "y": 80, "w": 40, "h": 40, "speed": 2, "direction": 1 }
 *     - AI-controlled hostile entity
 *     - Parameters:
 *       - x, y, w, h
 *       - speed (number, defaults to 2)
 *       - direction (1 for right, -1 for left; defaults to 1)
 *
 *
 * COMPOSITE SYSTEMS (Button + Action)
 * ───────────────────────────────────
 *
 * 11. BtnSpike (Button → Spike Toggle)
 *     ───────────────────────────────
 *     {
 *       "type": "BtnSpike",
 *       "button": { "x": 550, "y": 80, "w": 34, "h": 16 },
 *       "spike": { "x": 700, "y": 80, "w": 100, "h": 20 },
 *       "colorIndex": 0
 *     }
 *     - Pressing button toggles spike on/off
 *     - colorIndex: visual color/group (0-based)
 *
 * 12. WirePortal (Button → Portal Toggle)
 *     ──────────────────────────────────
 *     {
 *       "type": "WirePortal",
 *       "button": { "x": 800, "y": 80, "w": 34, "h": 16 },
 *       "portal": { "x": 1000, "y": 80, "w": 50, "h": 50 },
 *       "colorIndex": 0
 *     }
 *     - Pressing button opens portal
 *     - Portal remains open while button is held
 *
 * 13. BtnPlatform (Button → Platform Disappear/Reappear)
 *     ─────────────────────────────────────────────────
 *     {
 *       "type": "BtnPlatform",
 *       "button": { "x": 900, "y": 80, "w": 34, "h": 16 },
 *       "platforms": [
 *         { "x": 1050, "y": 200, "w": 160, "h": 30, "mode": "disappear" },
 *         { "x": 1050, "y": 300, "w": 160, "h": 30, "mode": "disappear" }
 *       ],
 *       "colorIndex": 0
 *     }
 *     - Pressing button toggles platforms
 *     - mode: "disappear" or "reappear"
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * MULTI-ROOM LEVELS
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * For levels with roomCount > 1:
 *
 * "rooms": [
 *   { "roomIndex": 0, "entityIndices": [0, 1, 2, 3] },   // Room 0 contains entities 0-3
 *   { "roomIndex": 1, "entityIndices": [4, 5, 6, 7] }    // Room 1 contains entities 4-7
 * ]
 *
 * Each room is laid out horizontally:
 *   Room 0: x from 0 to canvasWidth
 *   Room 1: x from canvasWidth to 2*canvasWidth
 *   Room 2: x from 2*canvasWidth to 3*canvasWidth
 *   etc.
 *
 * For single-room levels (roomCount === 1):
 *   - The "rooms" array can be omitted or contain a single entry
 *   - All entities are automatically assigned to Room 0
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * COMPLETE SINGLE-ROOM EXAMPLE
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * {
 *   "meta": {
 *     "id": "level_1723456789123",
 *     "title": "Beginner Tutorial",
 *     "authorName": "Bob",
 *     "createdAt": "2024-12-11T10:30:00Z"
 *   },
 *   "roomCount": 1,
 *   "canvasWidth": 1366,
 *   "canvasHeight": 768,
 *   "spawn": { "x": 100, "y": 400, "w": 40, "h": 40 },
 *   "entities": [
 *     { "type": "Wall", "x": 0, "y": 0, "w": 20, "h": 768 },
 *     { "type": "Wall", "x": 1346, "y": 0, "w": 20, "h": 768 },
 *     { "type": "Ground", "x": 0, "y": 0, "w": 1366, "h": 80 },
 *     { "type": "Spike", "x": 200, "y": 80, "w": 100, "h": 20 },
 *     { "type": "Spike", "x": 500, "y": 80, "w": 100, "h": 20 },
 *     { "type": "Platform", "x": 400, "y": 300, "w": 160, "h": 30 },
 *     { "type": "Checkpoint", "x": 400, "y": 80, "w": 40, "h": 70 },
 *     {
 *       "type": "BtnSpike",
 *       "button": { "x": 550, "y": 80, "w": 34, "h": 16 },
 *       "spike": { "x": 640, "y": 80, "w": 100, "h": 20 },
 *       "colorIndex": 0
 *     },
 *     { "type": "Portal", "x": 1200, "y": 80, "w": 50, "h": 50, "open": true }
 *   ]
 * }
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * MULTI-ROOM EXAMPLE (2 rooms)
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * {
 *   "meta": {
 *     "id": "level_1723456790000",
 *     "title": "Two-Room Adventure",
 *     "authorName": "Carol",
 *     "createdAt": "2024-12-11T11:00:00Z"
 *   },
 *   "roomCount": 2,
 *   "canvasWidth": 1366,
 *   "canvasHeight": 768,
 *   "spawn": { "x": 100, "y": 400, "w": 40, "h": 40 },
 *   "entities": [
 *     // Room 0 entities (x: 0 to 1366)
 *     { "type": "Wall", "x": 0, "y": 0, "w": 20, "h": 768 },
 *     { "type": "Ground", "x": 0, "y": 0, "w": 1366, "h": 80 },
 *     { "type": "Spike", "x": 200, "y": 80, "w": 100, "h": 20 },
 *     { "type": "WirePortal", "button": { "x": 500, "y": 80, "w": 34, "h": 16 }, "portal": { "x": 1200, "y": 80, "w": 50, "h": 50 }, "colorIndex": 0 },
 *
 *     // Room 1 entities (x: 1366 to 2732)
 *     { "type": "Ground", "x": 1366, "y": 0, "w": 1366, "h": 80 },
 *     { "type": "Wall", "x": 2712, "y": 0, "w": 20, "h": 768 },
 *     { "type": "Platform", "x": 1600, "y": 300, "w": 160, "h": 30 },
 *     { "type": "Portal", "x": 2200, "y": 80, "w": 50, "h": 50, "open": true }
 *   ],
 *   "rooms": [
 *     { "roomIndex": 0, "entityIndices": [0, 1, 2, 3] },
 *     { "roomIndex": 1, "entityIndices": [4, 5, 6, 7] }
 *   ]
 * }
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 */
