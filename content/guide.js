// Program guide sections, as structured data. Rendered by src/render/pages.js.
// Word budgets below are binding targets, not hard limits.
'use strict';

const sections = [
  {
    id: 'a1-how-this-works',
    title: 'How This Works',
    wordBudget: 600,
    body: [
      { type: 'p', text: 'This program runs on one rule: one focus, per game, measured. Not "play better" - one specific, countable thing, held across a block of ten games, then reviewed and changed. That is the entire method. Everything else in this guide exists to make that one rule easy to follow.' },
      { type: 'p', text: 'A focus is not a vague intention like "play safer" or "farm more." It is one of the twelve cards in the Focus Menu: a named skill, a number that proves whether you did it, a drill that trains it, and a graduation bar that tells you when to move on. You pick one card, hold it for a block of ten games, and ignore everything else on the menu until the block ends.' },
      { type: 'list', items: [
        'Read your baseline (Day 0) and pick your single weakest measurable thing.',
        'Warm up before every ranked game using the matching Warmup Card for your role.',
        'Play games in blocks of ten, holding one focus for the whole block.',
        'Log every game in the Tracker Workbook, even the ones you lose badly.',
        'Review at each block boundary and decide whether to graduate to a new focus or repeat.'
      ] },
      { type: 'p', text: 'Rank is the output of hundreds of small decisions compounding over months. This program does not touch rank directly, and it will not move your rank on a fixed schedule - that would be a promise this program cannot keep. What it measures instead is whether a specific decision pattern in your own games is improving, because that is the only thing you can actually control game to game, and it is the input rank is built from.' },
      { type: 'callout', text: 'What this can do: give you a specific, honest number to chase instead of a rank number that moves for reasons outside any one game. What this cannot do: guarantee that number moving translates into a rank climb on any particular timeline - League has enough variance (teammates, matchups, patches) that a fair test needs more games than most players are willing to log by hand.' },
      { type: 'p', text: 'Three ideas carry the whole program. First: deliberate practice beats volume - three games played with a specific goal and a specific review teach more than fifteen games played on autopilot. Second: you cannot fix what you do not measure - "I felt like I was farming better" is not a number; CS/min at the 10-minute mark is. Third: one thing at a time - trying to fix five habits in the same game means you cannot tell which fix, if any, worked. Hold one focus, get a clean read on it, then move to the next.' },
      { type: 'p', text: 'You will need: your own last ten ranked or normal games (read manually from your in-client match history - no API key, no third-party site, no account required), the Tracker Workbook included in this package, and roughly fifteen minutes before each session for the warmup plus five minutes after each game for the review. That is the entire cost of entry.' }
    ]
  },
  {
    id: 'a2-day-zero-baseline',
    title: 'Day 0: Baseline',
    wordBudget: 500,
    body: [
      { type: 'p', text: 'Before picking a focus, you need an honest read on where you actually are. This section is a manual data-collection step, done once, before Block 1 begins.' },
      { type: 'list', items: [
        'Open your in-client match history and find your last 10 completed games (ranked if you have them, normal if not - consistency of game mode matters less than having 10 real games).',
        'For each game, open the post-game stats screen and read off: the game number/date, your CS at the 10-minute mark (use the in-game timeline/graphs tab if your client has one; otherwise estimate from your final CS and average CS/min), your final CS/min, your total deaths, your vision score, and the result (win/loss).',
        'Enter all 10 rows into the Baseline sheet in the Tracker Workbook. Do not skip a bad game - a badly-performing game is data, not something to leave out.',
        'Let the sheet compute your 10-game averages. Do not average them by hand; the workbook does this so you cannot accidentally round in your own favor.'
      ] },
      { type: 'p', text: 'This step takes about twenty minutes the first time, using nothing but your own client and the included spreadsheet. There is no automated shortcut in this package on purpose - reading your own games manually is the first rep of the self-review habit Section A8 builds on later, and it means this program depends on no external tool, account, or API staying available.' },
      { type: 'callout', text: 'If you are brand new and do not have 10 completed games yet, play 10 normal games as close to how you\'d play ranked as possible, then use those as your baseline. The number matters less than having an honest starting point to measure change against.' },
      { type: 'p', text: 'Resist the urge to "clean up" the numbers by excluding a game where you got outplayed badly, or one where a teammate went AFK. Ten real games, including the ugly ones, is what makes the baseline honest. A baseline built only from your best games will make every future block look like regression, which is discouraging and wrong.' }
    ]
  },
  {
    id: 'a3-read-your-baseline',
    title: 'Read Your Baseline',
    wordBudget: 400,
    body: [
      { type: 'p', text: 'With your 10-game averages computed, compare your CS/min against the Benchmarks table below for your current rank. This is the only comparison in this program that uses a number you did not personally measure over time - everything after this point compares you against your own baseline, not against a community table.' },
      { type: 'table', ref: 'benchmarks' },
      { type: 'p', text: 'If your CS/min sits below your rank\'s band, farming consistency (the Farming Consistency focus card) is a strong first pick - it is the single most common gap and it compounds into gold for every other decision you make. If your CS/min is inside or above your band, look instead at your deaths-per-game and vision score against your own sense of what a clean game looks like for you, and consider Death Cause Control or Vision Cadence instead.' },
      { type: 'p', text: 'The rule for picking your first focus: choose the ONE measurable thing that is furthest from where it should be, not the one that feels most embarrassing or the one your teammates complain about most. A quiet weakness that is dragging every game down is worth more to fix first than a loud one that only shows up occasionally.' },
      { type: 'callout', text: 'Pick exactly one focus for Block 1. If two things look equally broken, pick the one that is easiest to measure cleanly - an ambiguous focus produces an ambiguous review, and an ambiguous review is where this whole method quietly falls apart.' }
    ]
  },
  {
    id: 'a4-the-focus-menu',
    title: 'The Focus Menu',
    wordBudget: 700,
    body: [
      { type: 'p', text: 'The Focus Menu is twelve cards, printed separately in this package, one per card, three to a page. Each card has the identical shape so you learn to read it once: a name, the skill it trains, where you train it (Practice Tool, a Normal game, or in Ranked itself), how long a rep takes, a numbered procedure of no more than five steps, a pass bar, a progression once you clear that bar, and the single most common way players fail the drill.' },
      { type: 'p', text: 'You are not expected to work through all twelve in order. You are expected to pick one per block based on what Section A3\'s baseline review actually shows you, work the matching drill until you clear its pass bar, and only then either graduate to the next relevant focus or repeat the block if the number has not moved yet.' },
      { type: 'focusCards' },
      { type: 'p', text: 'Two cards are role-specific by nature: Jungle Clear Efficiency only applies if you play jungle, and Farming Under Pressure matters most for lane roles that get pushed under tower. Everything else applies to every role, though the drill\'s exact setup may need light adaptation (a support running the CS drill, for example, should treat "no items" as "no items, and expect a lower raw number than a carry role" - the point is measuring your own improvement, not hitting a lane carry\'s number).' },
      { type: 'p', text: 'Every card\'s pass bar is either a community-sourced practice-tool figure with its source stated inline, or an explicit "calibrate from your own baseline" instruction where no honest community figure exists. Nothing on any card is invented to sound authoritative - if a card cannot cite where a number came from, it tells you to measure your own instead.' },
      { type: 'callout', text: 'Do not run more than one drill\'s pass-bar practice per session unless you have genuinely cleared the current block\'s focus already. Splitting attention across drills is the exact failure mode Section A1\'s "one thing at a time" principle exists to prevent.' }
    ]
  },
  {
    id: 'a5-the-session-loop',
    title: 'The Session Loop',
    wordBudget: 500,
    body: [
      { type: 'p', text: 'Every ranked session (not every game, every sitting down to play) follows the same four-step loop: warm up, play two or three focused games, review once, log everything.' },
      { type: 'list', items: [
        'Warm up (15 minutes) using the Warmup Card matching your role. Do not skip this because you feel warmed up already from a previous session earlier in the day - fifteen minutes of cold hands costs you more games than the warmup costs you time.',
        'Play 2-3 games holding your current block\'s focus. Not five, not one - two or three keeps each game\'s review sharp in your memory and prevents the session from sliding into unfocused queue-and-forget play.',
        'After each game, do the 2-minute One-Sentence Lesson (Section A8 covers the fuller VOD-review version for when you have more time) before queueing the next game.',
        'Log every game in the Tracker Workbook immediately - date, result, focus adherence, and the raw numbers the focus card asks for. A game logged the next day is a game you will misremember.'
      ] },
      { type: 'p', text: 'Explicit stop rules exist because a session that runs too long produces bad data, not just bad play. Stop the session if: you have played 3 games and are noticeably more tired or frustrated than when you started; you have lost 2 games in a row (see Section A9\'s two-loss rule); or you have crossed 90 minutes of continuous play. None of these are suggestions - treat them as hard stops the same way you would treat a drill\'s pass bar.' },
      { type: 'callout', text: 'A session that ends early because you hit a stop rule is not a failed session. It is the program working correctly. The entire point of the stop rules is to prevent the exact games that would otherwise corrupt your focus-adherence data.' },
      { type: 'p', text: 'If you cannot fit 2-3 games in a sitting, one game with a genuine warmup and a genuine review still counts and is still worth logging. Consistency across many short sessions beats occasional long ones for the same reason distributed practice beats cramming in any skill domain.' }
    ]
  },
  {
    id: 'a6-the-30-day-calendar',
    title: 'The 30-Day Calendar',
    wordBudget: 400,
    body: [
      { type: 'p', text: 'The program runs in three blocks of ten games each - not three blocks of ten days, since game count is what actually produces a fair read on a focus, and life does not deliver exactly ten games a day.' },
      { type: 'list', items: [
        'Block 1 (Games 1-10): the focus chosen from your Day 0 baseline review (Section A3).',
        'Block 1 Review: compare your focus number at the end of the block against where it started. Graduate to a new focus if you cleared the drill\'s pass bar; repeat the block with the same focus if you did not.',
        'Block 2 (Games 11-20): your next focus, chosen the same way - the single weakest measurable thing remaining.',
        'Block 2 Review: same process as Block 1.',
        'Block 3 (Games 21-30): your third focus.',
        'Block 3 Review, and a full 30-game retrospective: compare your Game 21-30 averages against your original Day 0 baseline across every number the Tracker Workbook tracks, not just the three focuses you happened to work on.'
      ] },
      { type: 'p', text: 'Thirty games is deliberately modest. It is enough to get a real, if noisy, read on three specific habits - it is not enough to expect a rank change on a fixed schedule, and this guide will not pretend otherwise. Section A11 addresses this directly: a 30-game program is a measurement window, not a promotion guarantee.' },
      { type: 'callout', text: 'If Block 1 needs repeating, that is normal and does not mean the program has failed - it means the number told you the truth. Repeat until the pass bar clears, then move the calendar forward from wherever that actually happens.' }
    ]
  },
  {
    id: 'a7-champion-pool-setup',
    title: 'Champion Pool Setup',
    wordBudget: 500,
    body: [
      { type: 'p', text: 'This section is blank by design in the package you received - no champion names are shipped anywhere in this product, on purpose (see the disclaimer in every footer). What follows is the method; you fill in the names yourself on the Champion Pool sheet.' },
      { type: 'p', text: 'The target shape is two mains plus one blind-pick option, and here is why three specifically: two mains gives you a answer for most role/matchup situations without spreading your mechanical reps too thin across many champions, and a third blind-pick option exists specifically for games where your normal picks are unavailable (banned, taken, or a clearly bad matchup) so you are never forced into a champion you have never practiced under pressure.' },
      { type: 'list', items: [
        'Main 1: your default pick for a neutral or favorable matchup.',
        'Main 2: a different playstyle or matchup answer to Main 1 - ideally one that covers the situations where Main 1 struggles.',
        'Blind pick: a safe, low-mechanical-complexity option for a matchup you have not scouted, or for when both mains are unavailable.'
      ] },
      { type: 'p', text: 'To test whether a pick actually belongs in your pool, run it through one full 10-game block as if it were your only champion for that role. Log the same numbers you log for anything else - if a "main" candidate produces worse focus numbers than your established pool, it is not ready to replace anything yet, no matter how much fun it is to play.' },
      { type: 'callout', text: 'Resist expanding past three champions per role while working through the 30-day calendar. A wider pool is a legitimate later goal, but it actively works against getting a clean read on any of this program\'s focus numbers, since a new champion changes your baseline numbers for reasons that have nothing to do with the focus you are trying to measure.' }
    ]
  },
  {
    id: 'a8-self-vod-review',
    title: 'Self VOD Review in 12 Minutes',
    wordBudget: 600,
    body: [
      { type: 'p', text: 'This is the fuller review, distinct from the 2-minute one-sentence lesson in the Session Loop - use it once per block at minimum, or after any game that felt genuinely confusing while you were playing it. It uses your client\'s own replay/timeline feature; no external tool is required.' },
      { type: 'p', text: 'Four checkpoints, roughly three minutes each:' },
      { type: 'list', items: [
        'Checkpoint 1, 0-3 minutes (Lane Setup): watch your first back-and-forth with your lane opponent. Did your positioning at level 1 match the matchup you expected? Note it on the Matchup Study Sheet if this is a matchup you have not documented yet.',
        'Checkpoint 2, First Back: watch the recall/reset around minions 1-2. Was the timing efficient (Recall Timing drill), and did your item purchase match what the game state actually called for?',
        'Checkpoint 3, Mid-Game Grouping: watch the first time your team grouped for an objective or fight. Were you where you needed to be, and did you call the objective timer early (Objective-Timer Pre-Call drill)?',
        'Checkpoint 4, The Fight That Decided It: identify the single fight or skirmish that most changed the game\'s outcome and watch it twice - once for your own positioning, once for what the enemy team did that worked.'
      ] },
      { type: 'p', text: 'After all four checkpoints, write the same single-sentence lesson the Session Loop asks for after every game - one specific action, not a feeling. The difference here is that this fuller review sometimes surfaces a lesson the 2-minute version would have missed, because you are watching your own decisions back rather than relying on memory alone.' },
      { type: 'callout', text: 'Twelve minutes is a target, not a ceiling. If a checkpoint genuinely needs more time because something confusing happened, take it - the time budget exists to make this review feel achievable after a long session, not to cut a real insight short.' },
      { type: 'p', text: 'Use the VOD Review Sheet (a fillable one-page template in this package) to write down the timestamp and a short note for each checkpoint as you go, rather than trying to hold all four in memory until the end.' }
    ]
  },
  {
    id: 'a9-tilt-and-stop-rules',
    title: 'Tilt and Stop Rules',
    wordBudget: 400,
    body: [
      { type: 'p', text: 'Tilt is not a character flaw to feel bad about - it is a measurable state (frustration narrowing your decision-making) that this program treats the same way it treats any other variable: with a specific, pre-committed rule instead of an in-the-moment judgment call, because in-the-moment judgment is exactly what tilt degrades.' },
      { type: 'list', items: [
        'The two-loss stop rule: lose two games in a row and the session ends, no exceptions, no "one more to break even." Log both games honestly and close the client.',
        'The 4-7-8 breathing reset: inhale for 4 seconds, hold for 7, exhale for 8. Repeat three times before deciding whether to queue again, even outside the two-loss rule, any time you notice your hands are tense or your thoughts are on the last death rather than the next play.',
        'Log it, then close the client: write your one-sentence lesson for the session\'s last game before you do anything else - not after taking a break, not "later." Closing the client without logging is how the review habit quietly dies.'
      ] },
      { type: 'p', text: 'These rules exist because the cost of one extra tilted game is not symmetric with the benefit: a game played to try to "fix" a bad mood tends to produce worse focus-adherence data and a worse outcome, which then produces more tilt. The two-loss rule breaks that loop mechanically, before willpower has to do it.' },
      { type: 'callout', text: 'If you find yourself negotiating with the two-loss rule ("just one more, I know I can turn it around"), that itself is useful data - write it down as a lesson. The negotiation is the tilt talking, and noticing it is a real skill this program is also quietly training.' }
    ]
  },
  {
    id: 'a10-when-to-change-focus',
    title: 'When to Change Focus / Graduation Criteria',
    wordBudget: 300,
    body: [
      { type: 'p', text: 'Graduate out of a focus and pick a new one when both of these are true: you cleared the matching drill\'s pass bar in Practice Tool or its equivalent live-game measure, and your block-end average for that focus\'s number has moved meaningfully from where the block started - not just on your best game, across the block\'s average.' },
      { type: 'p', text: 'If only one of the two is true (you cleared the drill in isolation but the live-game number has not moved, or the live number moved but you never actually cleared the drill cleanly), repeat the block. A drill cleared in Practice Tool that does not show up in real games has not actually transferred yet, and that gap is exactly what another block is for.' },
      { type: 'callout', text: 'It is normal, and common, to need two blocks on the same focus before it graduates. Nothing about this program rewards moving fast between focuses - it rewards a number that actually moved.' }
    ]
  },
  {
    id: 'a11-faq',
    title: 'FAQ and What This Is Not',
    wordBudget: 400,
    body: [
      { type: 'p', text: 'This is not a boost. Nobody plays your account, and there is no service component of any kind in this package - every drill, every review, and every log entry is something you do yourself.' },
      { type: 'p', text: 'This is not a rank guarantee. Thirty games is a real but modest sample against a game with genuine variance from teammates, matchups, and patches. The program measures whether specific, controllable habits improved - it does not and cannot promise those habits translate into a rank change on any fixed timeline.' },
      { type: 'p', text: 'This is not affiliated with, endorsed by, or sponsored by Riot Games in any way. "League of Legends" is used here only descriptively, to say what game this program is for - it is a trademark of Riot Games, Inc.' },
      { type: 'list', items: [
        'Do I need a Riot API key or any account to use this? No. Every drill and every measurement uses only your own client and the included spreadsheet.',
        'What if I do not have 30 games\' worth of time before I need results? This program is not built for a deadline - it is built for a durable habit change. A shorter version will show less data, not faster results.',
        'Can I run two focuses at once? You can, but the review at the end becomes ambiguous - if both numbers move, you will not know which drill, if either, caused it. One at a time is the whole method.',
        'What if my rank drops during a block? Keep logging honestly. A rank dip during deliberate focus work is common and not itself evidence the program is failing - the 30-game retrospective, not any single block, is where to actually judge that.'
      ] }
    ]
  }
];

module.exports = { sections };
