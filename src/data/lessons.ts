import { LessonModule } from '../types/go';

export const LESSONS: LessonModule[] = [
  {
    id: 'lesson-1-basics',
    number: 1,
    title: 'The Grid & Placing Stones',
    subtitle: 'Where stones live on a Go board',
    duration: '1 min',
    badge: 'First Step',
    conceptSummary:
      'Unlike Chess or Checkers, Go stones are placed ON the intersections where the lines cross—including the outer edges and corners!',
    steps: [
      {
        id: '1-1',
        title: 'Place a Stone at the Center Star Point',
        instruction:
          'Welcome to Go! Look at the board: the lines cross to form intersections. Tap or click the glowing center dot (D4) to place your first Black stone.',
        whyItMatters:
          'Every intersection on the grid—center, side, or corner—counts as one point of space. Black always plays first!',
        boardSize: 7,
        initialStones: [],
        playerColor: 'B',
        annotations: [{ point: { row: 3, col: 3 }, type: 'target', label: 'Play Here' }],
        goalType: 'place_specific',
        targetPoints: [{ row: 3, col: 3 }],
        successMessage:
          'Awesome! You placed your first stone right on the center intersection (Tengen). Notice the 4 glowing green dots around it—those are its "breaths"!',
        wrongMoveHint:
          'Tap or click directly on the glowing center intersection (row 4, column D).',
      },
      {
        id: '1-2',
        title: 'Edges & Corners Are Valid Too!',
        instruction:
          'Stones can also be placed on the outer perimeter lines and corners. Place a Black stone on any of the 4 highlighted corner intersections.',
        whyItMatters:
          'The edges of the board act like natural walls—we will soon see how corners make it easy to surround territory.',
        boardSize: 7,
        initialStones: [
          { row: 3, col: 3, color: 'B' },
          { row: 2, col: 4, color: 'W' },
        ],
        playerColor: 'B',
        annotations: [
          { point: { row: 0, col: 0 }, type: 'target', label: 'A7' },
          { point: { row: 0, col: 6 }, type: 'target', label: 'G7' },
          { point: { row: 6, col: 0 }, type: 'target', label: 'A1' },
          { point: { row: 6, col: 6 }, type: 'target', label: 'G1' },
        ],
        goalType: 'place_specific',
        targetPoints: [
          { row: 0, col: 0 },
          { row: 0, col: 6 },
          { row: 6, col: 0 },
          { row: 6, col: 6 },
        ],
        successMessage:
          'Great job! Once placed, Go stones never slide or move around the board—they stay where you place them unless captured.',
        wrongMoveHint: 'Pick one of the 4 extreme corners of the grid (A7, G7, A1, or G1).',
      },
    ],
  },
  {
    id: 'lesson-2-liberties',
    number: 2,
    title: 'Liberties ("Breaths")',
    subtitle: 'How stones stay alive on the board',
    duration: '2 mins',
    badge: 'Vital Rule',
    conceptSummary:
      'Every stone needs empty adjacent intersections (up, down, left, right) to breathe. These empty spots are called LIBERTIES. Diagonals never count!',
    steps: [
      {
        id: '2-1',
        title: 'Center vs. Edge vs. Corner Liberties',
        instruction:
          'Look at the Corner stone (2 liberties) and Edge stone (3 liberties). Place a Black stone at D4 in the open center so it enjoys the maximum 4 liberties!',
        whyItMatters:
          'A stone in the open center has 4 orthogonal lines coming out of it, so it takes 4 enemy stones to surround and capture it.',
        boardSize: 7,
        initialStones: [
          { row: 0, col: 0, color: 'W' },
          { row: 0, col: 3, color: 'W' },
        ],
        playerColor: 'B',
        annotations: [{ point: { row: 3, col: 3 }, type: 'target', label: '4 Breaths' }],
        goalType: 'place_specific',
        targetPoints: [{ row: 3, col: 3 }],
        successMessage:
          'Look at the Live Liberty Visualizer! Your stone at D4 has 4 glowing green dots (up, down, left, right). Hover or tap the White stones at the top to see they only have 2 and 3 liberties!',
        wrongMoveHint: 'Place your Black stone at the highlighted center spot (D4).',
      },
      {
        id: '2-2',
        title: 'Take Away an Opponent’s Liberty',
        instruction:
          'The White stone at D4 currently has 3 liberties left. Place a Black stone on one of its open adjacent points (C4, E4, or D3) to reduce White to 2 liberties.',
        whyItMatters:
          'Whenever you play directly next to an enemy stone along a line, you block one of its breathing spaces.',
        boardSize: 7,
        initialStones: [
          { row: 3, col: 3, color: 'W' },
          { row: 2, col: 3, color: 'B' },
        ],
        playerColor: 'B',
        annotations: [
          { point: { row: 3, col: 2 }, type: 'target' },
          { point: { row: 3, col: 4 }, type: 'target' },
          { point: { row: 4, col: 3 }, type: 'target' },
        ],
        goalType: 'place_specific',
        targetPoints: [
          { row: 3, col: 2 },
          { row: 3, col: 4 },
          { row: 4, col: 3 },
        ],
        successMessage:
          'Spot on! Notice how the White stone dropped from 3 liberties (green) to 2 liberties (amber warning). Remember: diagonal spots do not take away liberties—only straight lines count!',
        wrongMoveHint:
          'Play directly left, right, or below the White stone along the grid lines.',
      },
    ],
  },
  {
    id: 'lesson-3-atari-capture',
    number: 3,
    title: 'Atari & Capturing Stones',
    subtitle: 'Removing enemy stones that run out of breaths',
    duration: '2 mins',
    badge: 'Combat',
    conceptSummary:
      'When a stone or group has only 1 liberty left, it is in ATARI (like "Check" in Chess). If you play on its very last liberty, those stones are captured and removed!',
    steps: [
      {
        id: '3-1',
        title: 'Capture a Stone in Atari',
        instruction:
          'The White stone at D4 is pulsing red because it is in ATARI—it has only 1 breath left at E4! Place your Black stone on E4 to capture it.',
        whyItMatters:
          'Captured stones are removed from the board, opening up space and earning points.',
        boardSize: 7,
        initialStones: [
          { row: 3, col: 3, color: 'W' },
          { row: 2, col: 3, color: 'B' },
          { row: 4, col: 3, color: 'B' },
          { row: 3, col: 2, color: 'B' },
        ],
        playerColor: 'B',
        annotations: [{ point: { row: 3, col: 4 }, type: 'target', label: 'Capture!' }],
        goalType: 'capture_any',
        targetPoints: [{ row: 3, col: 4 }],
        successMessage:
          'Boom! You filled White’s last liberty at E4 and captured the stone!',
        wrongMoveHint: 'Play at E4 (the pulsing last liberty right next to the White stone).',
      },
      {
        id: '3-2',
        title: 'Capture a Whole Group at Once',
        instruction:
          'Connected stones live and die together! All 3 White stones in the center share just 1 last liberty at D3. Play at D3 to capture all 3 White stones in a single move!',
        whyItMatters:
          'Even a large army of stones will be captured all at once if its last shared liberty is filled.',
        boardSize: 7,
        initialStones: [
          { row: 3, col: 2, color: 'W' },
          { row: 3, col: 3, color: 'W' },
          { row: 3, col: 4, color: 'W' },
          { row: 2, col: 2, color: 'B' },
          { row: 2, col: 3, color: 'B' },
          { row: 2, col: 4, color: 'B' },
          { row: 3, col: 1, color: 'B' },
          { row: 3, col: 5, color: 'B' },
          { row: 4, col: 2, color: 'B' },
          { row: 4, col: 4, color: 'B' },
        ],
        playerColor: 'B',
        annotations: [{ point: { row: 4, col: 3 }, type: 'target', label: 'Last Breath!' }],
        goalType: 'capture_any',
        targetPoints: [{ row: 4, col: 3 }],
        successMessage:
          'Triple capture! Because those 3 White stones were connected along a line, they shared a single fate.',
        wrongMoveHint: 'Play at D3 (directly below the middle White stone) to take its last liberty.',
      },
    ],
  },
  {
    id: 'lesson-4-groups',
    number: 4,
    title: 'Connecting & Rescuing Groups',
    subtitle: 'Unity is strength—pooling liberties together',
    duration: '2 mins',
    badge: 'Teamwork',
    conceptSummary:
      'Stones of the same color touching along a horizontal or vertical line form a single GROUP and share all their liberties. Diagonal stones are NOT connected!',
    steps: [
      {
        id: '4-1',
        title: 'Save a Stone from Atari!',
        instruction:
          'Emergency! Your Black stone at D4 is in Atari (1 breath left at D3). Play at D3 to extend your stone into a 2-stone group and escape capture!',
        whyItMatters:
          'Extending from a stone in Atari joins the new stone’s liberties to the old stone, rescuing it.',
        boardSize: 7,
        initialStones: [
          { row: 3, col: 3, color: 'B' },
          { row: 2, col: 3, color: 'W' },
          { row: 3, col: 2, color: 'W' },
          { row: 3, col: 4, color: 'W' },
        ],
        playerColor: 'B',
        annotations: [{ point: { row: 4, col: 3 }, type: 'target', label: 'Rescue!' }],
        goalType: 'place_specific',
        targetPoints: [{ row: 4, col: 3 }],
        successMessage:
          'Saved! Look at the Group Bridge connecting D4 and D3: your 2-stone group now shares 3 healthy liberties at the bottom!',
        wrongMoveHint: 'Play at D3 (the empty spot right below your endangered Black stone).',
      },
      {
        id: '4-2',
        title: 'Bridge Two Diagonal Stones Together',
        instruction:
          'Right now your Black stones at C4 and D3 are diagonal—they are NOT connected, and C4 is in Atari! Play at C3 to link them into one strong group.',
        whyItMatters:
          'Connecting weak separated stones into a single solid group is one of the smartest defensive skills in Go.',
        boardSize: 7,
        initialStones: [
          { row: 3, col: 2, color: 'B' },
          { row: 4, col: 3, color: 'B' },
          { row: 2, col: 2, color: 'W' },
          { row: 3, col: 1, color: 'W' },
          { row: 3, col: 3, color: 'W' },
        ],
        playerColor: 'B',
        annotations: [{ point: { row: 4, col: 2 }, type: 'target', label: 'Connect!' }],
        goalType: 'place_specific',
        targetPoints: [{ row: 4, col: 2 }],
        successMessage:
          'Connected! Notice the visual connector bars joining all 3 Black stones into a single unified group with 4 liberties.',
        wrongMoveHint: 'Play at C3 (below C4 and left of D3) to join both Black stones.',
      },
    ],
  },
  {
    id: 'lesson-5-forbidden',
    number: 5,
    title: 'Forbidden Moves: Suicide & Ko',
    subtitle: 'The only two places you cannot play',
    duration: '2 mins',
    badge: 'Key Exceptions',
    conceptSummary:
      'You can play on almost any empty intersection in Go, with two exceptions: 1) No Self-Capture (Suicide), unless your move captures enemy stones first! 2) No infinite loops (The Ko Rule).',
    steps: [
      {
        id: '5-1',
        title: 'Capture Beats Self-Capture!',
        instruction:
          'The spot at D4 is completely surrounded by White stones—normally playing there would be forbidden "suicide". EXCEPT those 4 White stones only have 1 liberty left (at D4)! Play at D4 to capture them!',
        whyItMatters:
          'When you place a stone, Go checks if enemy stones lose their last breath BEFORE checking your own stone’s breaths.',
        boardSize: 7,
        initialStones: [
          { row: 2, col: 3, color: 'W' },
          { row: 4, col: 3, color: 'W' },
          { row: 3, col: 2, color: 'W' },
          { row: 3, col: 4, color: 'W' },
          // Surround the 4 white stones on the outside with Black stones
          { row: 1, col: 3, color: 'B' },
          { row: 2, col: 2, color: 'B' },
          { row: 2, col: 4, color: 'B' },
          { row: 3, col: 1, color: 'B' },
          { row: 3, col: 5, color: 'B' },
          { row: 4, col: 2, color: 'B' },
          { row: 4, col: 4, color: 'B' },
          { row: 5, col: 3, color: 'B' },
        ],
        playerColor: 'B',
        annotations: [{ point: { row: 3, col: 3 }, type: 'target', label: 'Capture 4!' }],
        goalType: 'capture_any',
        targetPoints: [{ row: 3, col: 3 }],
        successMessage:
          'Brilliant! Even though D4 had no empty spaces around it, playing there took away White’s final breath first—clearing 4 White stones off the board!',
        wrongMoveHint: 'Tap D4 right in the middle of the diamond to capture all 4 White stones.',
      },
    ],
  },
  {
    id: 'lesson-6-two-eyes',
    number: 6,
    title: 'Immortal Groups: Making "Two Eyes"',
    subtitle: 'How to make your stones uncapturable forever',
    duration: '2 mins',
    badge: 'Aha! Moment',
    conceptSummary:
      'If a group of stones encloses TWO separate internal empty intersections ("Two Eyes"), the opponent can NEVER capture it—because they can only play one stone per turn, and playing in either eye alone is forbidden suicide!',
    steps: [
      {
        id: '6-1',
        title: 'Split One Space into Two Separate Eyes',
        instruction:
          'Your Black group in the corner is completely surrounded on the outside by White. Right now it has a 3-space room inside. Play at B6 (the middle spot) to divide that room into TWO separate 1-point eyes (A6 and C6)!',
        whyItMatters:
          'A group with only ONE eye can eventually be filled and captured. A group with TWO separate eyes is 100% immortal!',
        boardSize: 7,
        initialStones: [
          // Black wall enclosing row 1 (top area) cols 0,1,2
          { row: 0, col: 0, color: 'B' },
          { row: 0, col: 1, color: 'B' },
          { row: 0, col: 2, color: 'B' },
          { row: 0, col: 3, color: 'B' },
          { row: 1, col: 3, color: 'B' },
          { row: 2, col: 0, color: 'B' },
          { row: 2, col: 1, color: 'B' },
          { row: 2, col: 2, color: 'B' },
          { row: 2, col: 3, color: 'B' },
          // White surrounding outside
          { row: 0, col: 4, color: 'W' },
          { row: 1, col: 4, color: 'W' },
          { row: 2, col: 4, color: 'W' },
          { row: 3, col: 0, color: 'W' },
          { row: 3, col: 1, color: 'W' },
          { row: 3, col: 2, color: 'W' },
          { row: 3, col: 3, color: 'W' },
        ],
        playerColor: 'B',
        annotations: [
          { point: { row: 1, col: 0 }, type: 'eye', label: 'Eye 1' },
          { point: { row: 1, col: 1 }, type: 'target', label: 'Split Here!' },
          { point: { row: 1, col: 2 }, type: 'eye', label: 'Eye 2' },
        ],
        goalType: 'place_specific',
        targetPoints: [{ row: 1, col: 1 }],
        successMessage:
          'Immortal! Look at A6 (Eye 1) and C6 (Eye 2): White can never play in A6 because Black still breathes at C6, and White can never play in C6 because Black still breathes at A6. Your group is alive forever!',
        wrongMoveHint: 'Play at B6 (row 6, column B) right between Eye 1 and Eye 2.',
      },
    ],
  },
  {
    id: 'lesson-7-territory',
    number: 7,
    title: 'The True Goal: Surrounding Territory',
    subtitle: 'How you actually win a game of Go',
    duration: '2 mins',
    badge: 'Strategy',
    conceptSummary:
      'Capturing stones is fun, but Go is won by whoever controls the most total space (Your Stones on the Board + Empty Intersections you fence off).',
    steps: [
      {
        id: '7-1',
        title: 'Complete the Border Fence',
        instruction:
          'Black has built a wall on the left side, but there is a gap at C1 at the bottom edge! Play at C1 to seal the border and claim the entire left side as Black Territory.',
        whyItMatters:
          'Using the board edges as natural walls lets you fence off big territory with very few stones.',
        boardSize: 7,
        initialStones: [
          { row: 0, col: 2, color: 'B' },
          { row: 1, col: 2, color: 'B' },
          { row: 2, col: 2, color: 'B' },
          { row: 3, col: 2, color: 'B' },
          { row: 4, col: 2, color: 'B' },
          { row: 5, col: 2, color: 'B' },
          { row: 0, col: 4, color: 'W' },
          { row: 1, col: 4, color: 'W' },
          { row: 2, col: 4, color: 'W' },
          { row: 3, col: 4, color: 'W' },
          { row: 4, col: 4, color: 'W' },
          { row: 5, col: 4, color: 'W' },
          { row: 6, col: 4, color: 'W' },
        ],
        playerColor: 'B',
        annotations: [{ point: { row: 6, col: 2 }, type: 'target', label: 'Seal Border' }],
        goalType: 'place_specific',
        targetPoints: [{ row: 6, col: 2 }],
        successMessage:
          'Border sealed! Toggle on the "Territory Map" button above the board to see all 14 empty points on the left light up as Black’s controlled territory!',
        wrongMoveHint: 'Play at C1 (bottom row, 3rd column from the left) to finish your wall.',
      },
    ],
  },
  {
    id: 'lesson-8-scoring',
    number: 8,
    title: 'Finishing a Game, Komi & Passing',
    subtitle: 'When to stop playing and how the winner is crowned',
    duration: '1 min',
    badge: 'Ready to Play!',
    conceptSummary:
      'When all borders are sealed and no useful moves remain, you click PASS. When both players Pass in a row, the game ends and scores are counted! Because Black gets to play first, White receives +5.5 bonus points ("Komi") to keep the game fair.',
    steps: [
      {
        id: '8-1',
        title: 'Seal the Final Neutral Point (Dame)',
        instruction:
          'This 7x7 game is almost over! Only one open point at D4 separates Black’s left territory from White’s right territory. Play at D4 to claim the final point and finish the curriculum!',
        whyItMatters:
          'Under Area Scoring (used in GoTeacher), every stone you have on the board plus every empty point you surround counts as 1 point—so you never lose points by reinforcing your walls.',
        boardSize: 7,
        initialStones: [
          { row: 0, col: 2, color: 'B' },
          { row: 1, col: 2, color: 'B' },
          { row: 2, col: 2, color: 'B' },
          { row: 3, col: 2, color: 'B' },
          { row: 4, col: 2, color: 'B' },
          { row: 5, col: 2, color: 'B' },
          { row: 6, col: 2, color: 'B' },
          { row: 0, col: 4, color: 'W' },
          { row: 1, col: 4, color: 'W' },
          { row: 2, col: 4, color: 'W' },
          { row: 3, col: 4, color: 'W' },
          { row: 4, col: 4, color: 'W' },
          { row: 5, col: 4, color: 'W' },
          { row: 6, col: 4, color: 'W' },
          { row: 0, col: 3, color: 'B' },
          { row: 1, col: 3, color: 'W' },
          { row: 2, col: 3, color: 'B' },
          { row: 4, col: 3, color: 'W' },
          { row: 5, col: 3, color: 'B' },
          { row: 6, col: 3, color: 'W' },
        ],
        playerColor: 'B',
        annotations: [{ point: { row: 3, col: 3 }, type: 'target', label: 'Final Point!' }],
        goalType: 'place_specific',
        targetPoints: [{ row: 3, col: 3 }],
        successMessage:
          'Congratulations—you have mastered all the core rules of Go! You are ready to jump into "Play vs AI" and play your first real game with live coach hints.',
        wrongMoveHint: 'Play at the last remaining center point (D4) to complete the game.',
      },
    ],
  },
];
