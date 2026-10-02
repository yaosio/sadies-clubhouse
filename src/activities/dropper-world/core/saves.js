// Every save Dropper World keeps in the browser, in one list (the names are from before there was a
// clubhouse, so they're never renamed: everyone's would be lost). Its card's `keeps` covers them all,
// and starting it over, from the pause menu or the dev sheet, erases every one.
export const SAVES = {
  board: 'sadies-dropper-world.save',       // the tower, Sadie and Chooter (save.js)
  best: 'jellystack.best',                  // the tallest the tower's been (world.js)
  climbBest: 'jellystack.climbBest',        // the highest Sadie's climbed
  met: 'sadie.chooter.met',                 // Sadie's met Chooter (friends/chooter.js)
  movedIn: 'sadie.chooter.movedIn',         // ...and he's moved in
  tuning: 'jellystack.settings3',           // the dev sheet's physics (config.js)
  perf: 'jellystack.perf',                  // the dev sheet's speed meter (ui/perf.js)
};
