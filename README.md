# 2D Snooker Physics Engine & Simulation

A 2D playable snooker simulation built in JavaScript using **p5.js** for rendering and **Matter.js** for 2D rigid-body collision physics[cite: 44]. Built for **CM2020: Graphics Programming**[cite: 44].

---

## What’s Under the Hood

* **Rigid-Body Table Physics:** Models the snooker table with trapezoidal cushion colliders and circular ball bodies, complete with friction, air resistance, and adjustable cushion bounciness[cite: 44].
* **Cue & Aiming System:** Uses a mouse-directed vector guide to aim shots, paired with an animated cue stick and variable shot power (5% to 98%) controlled by the arrow keys[cite: 44].
* **Collision & Foul Tracking:** Uses `Matter.Query` to monitor ball-to-ball and ball-to-cushion contact in real time, detecting fouls and enforcing red-then-color potting rules[cite: 44].
* **Gravity Wells (Mode 4):** Procedurally spawns pulsating gravitational hazards across the table that pull nearby balls off-course using inverse-square force calculations without pocketing them[cite: 44].
* **Power-Up Pockets:** Randomly activates pockets with special bonuses on successful pots, including 2x score multipliers, extra shots, and cue power boosts[cite: 44].

---

## Game Modes

1. **Standard Mode:** Traditional snooker setup with 15 reds in a triangle and 6 colored balls on their standard spots[cite: 44].
2. **Random All:** Randomizes both red and colored ball positions across the table with built-in overlap prevention[cite: 44].
3. **Random Reds:** Keeps colored balls locked on their regulation spots while scattering reds across the table[cite: 44].
4. **Gravity Wells Mode:** Spawns gravitational attractors that bend ball paths mid-roll[cite: 44].

---

## Controls

* **Mouse:** Move to aim; click and drag to place the cue ball inside the 'D' zone[cite: 44].
* **Left / Right Arrow Keys:** Decrease or increase shot power[cite: 44].
* **Click / Release:** Strike the cue ball[cite: 44].
* **Slider:** Tweak cushion restitution (bounciness) from 0.7 to 1.2 on the fly[cite: 44].
* **Enter:** Acknowledge and dismiss foul notices[cite: 44].
* **ESC:** Reset the table or jump back to the main menu[cite: 44].

---

## Project Structure

```text
├── Libraries/
│   ├── matter.js          # Matter.js physics engine
│   ├── p5.min.js          # p5.js graphics canvas
│   └── p5.sound.min.js    # Audio library
├── index.html             # Entry point
├── sketch.js              # Game logic, rendering loop, and physics setup
└── README.md