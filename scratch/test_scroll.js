// Simulate the scroll calculation for category cards
// Mimic the DOM measurements

const vw = 1280; // typical desktop viewport

// Simulate a track with category cards placed at realistic positions
// Based on typical spine-track layout with cards ~340px wide + gaps
const cardWidth = 340;
const gap = 40;
const trackPadding = 200; // initial left padding before first card

// Simulated categories in order:
// FOOD & BEVERAGE, REAL ESTATE, HEALTHCARE, AUTOMOTIVE, FASHION
const categories = [
  { name: 'FOOD & BEVERAGE', offsetLeft: trackPadding },
  { name: 'REAL ESTATE & INTERIORS & ARCHITECTURE', offsetLeft: trackPadding + cardWidth + gap },
  { name: 'HEALTHCARE & BEAUTY', offsetLeft: trackPadding + (cardWidth + gap) * 2 },
  { name: 'AUTOMOTIVE', offsetLeft: trackPadding + (cardWidth + gap) * 3 },
  { name: 'FASHION', offsetLeft: trackPadding + (cardWidth + gap) * 4 },
];

// Simulate track.scrollWidth — track has all cards + end spacer
const totalCards = 12; // project cards
const catCards = 5;
const trackScrollWidth = trackPadding + (totalCards + catCards) * (cardWidth + gap) + 800; // end spacer

const totalTravel = trackScrollWidth - vw / 2;

console.log('=== Scroll Calculation Test ===');
console.log(`Viewport width: ${vw}px`);
console.log(`Track scrollWidth: ${trackScrollWidth}px`);
console.log(`Total travel: ${totalTravel}px`);
console.log('');

categories.forEach(cat => {
  const cardCenter = cat.offsetLeft + cardWidth / 2;
  const fraction = Math.max(0, Math.min(0.98, (cardCenter - vw / 2) / totalTravel));
  const totalProgress = 0.2 + fraction * 0.8;
  
  // Verify: at this progress, where would the track be?
  // trackX = -totalTravel * fraction
  const trackX = -totalTravel * fraction;
  // card center on screen = trackX + cardCenter
  const cardOnScreen = trackX + cardCenter;
  
  console.log(`Category: ${cat.name}`);
  console.log(`  cardCenter: ${cardCenter}px`);
  console.log(`  fraction:   ${fraction.toFixed(4)}`);
  console.log(`  progress:   ${totalProgress.toFixed(4)}`);
  console.log(`  trackX:     ${Math.round(trackX)}px`);
  console.log(`  card appears at screen x: ${Math.round(cardOnScreen)}px  (target: ${vw/2}px = center)`);
  console.log(`  offset from center: ${Math.round(cardOnScreen - vw/2)}px`);
  console.log('');
});
