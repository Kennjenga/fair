# Ranking Methods Analysis

## Current Method: Borda Count (Linear Descending)

### How It Works
- **Formula**: `points = numberOfTeams - rank + 1`
- **Example** (10 teams): Rank 1 = 10 pts, Rank 2 = 9 pts, ..., Rank 10 = 1 pt
- **Default Config**: `{1: 10, 2: 7, 3: 5, 4: 3, 5: 1}` (fixed points for top 5)

### Pros
✅ Simple and intuitive  
✅ Fair - gives weight to all positions  
✅ Widely understood and accepted  
✅ Works well with weighted voting (voter_weight, judge_weight)  

### Cons
❌ Linear gaps may not reflect true preference intensity  
❌ Can be manipulated with strategic voting  
❌ Lower ranks get very few points (may not matter much)  

---

## Alternative Ranking Methods

### 1. **Quadratic Borda Count** (Recommended for Hackathons)
**Formula**: `points = (numberOfTeams - rank + 1)²`

**Example** (10 teams):
- Rank 1: 100 pts (10²)
- Rank 2: 81 pts (9²)
- Rank 3: 64 pts (8²)
- Rank 4: 49 pts (7²)
- Rank 5: 36 pts (6²)

**Pros:**
- ✅ Strongly rewards top positions (more competitive)
- ✅ Better reflects preference intensity
- ✅ Reduces impact of strategic voting
- ✅ Great for hackathons where top 3-5 really matter

**Cons:**
- ❌ Larger point gaps (may seem unfair to lower ranks)
- ❌ More complex to explain

**Use Case**: Best for competitive hackathons where distinguishing top performers is critical

---

### 2. **Exponential Borda Count**
**Formula**: `points = 2^(numberOfTeams - rank)`

**Example** (10 teams):
- Rank 1: 512 pts (2⁹)
- Rank 2: 256 pts (2⁸)
- Rank 3: 128 pts (2⁷)
- Rank 4: 64 pts (2⁶)
- Rank 5: 32 pts (2⁵)

**Pros:**
- ✅ Extremely strong preference for top positions
- ✅ Very difficult to manipulate
- ✅ Clear winner differentiation

**Cons:**
- ❌ Very large point differences
- ❌ Lower ranks become almost irrelevant
- ❌ May be too extreme for some use cases

**Use Case**: High-stakes competitions where only top 1-3 matter

---

### 3. **Square Root Borda Count** (More Balanced)
**Formula**: `points = Math.sqrt(numberOfTeams - rank + 1) * numberOfTeams`

**Example** (10 teams):
- Rank 1: ~31.6 pts
- Rank 2: ~28.5 pts
- Rank 3: ~25.3 pts
- Rank 4: ~22.1 pts
- Rank 5: ~18.7 pts

**Pros:**
- ✅ More balanced point distribution
- ✅ Still rewards top positions
- ✅ Less extreme than quadratic/exponential
- ✅ Better for inclusive competitions

**Cons:**
- ❌ Less differentiation at the top
- ❌ More complex calculation

**Use Case**: Community-focused events where all participants should feel valued

---

### 4. **Top-Heavy Borda** (Custom Distribution)
**Formula**: Custom point distribution that heavily favors top positions

**Example Config**:
```json
{
  "1": 100,
  "2": 50,
  "3": 25,
  "4": 10,
  "5": 5,
  "6": 2,
  "7": 1,
  "8": 0,
  "9": 0,
  "10": 0
}
```

**Pros:**
- ✅ Highly customizable
- ✅ Can match specific competition goals
- ✅ Clear top performer rewards

**Cons:**
- ❌ Requires careful configuration
- ❌ Lower ranks may feel excluded

**Use Case**: When you want specific point distribution for your competition

---

### 5. **Condorcet Method** (Pairwise Comparison)
**How It Works**: Compares each team against every other team in head-to-head matchups

**Pros:**
- ✅ Most mathematically sound
- ✅ Handles ties and cycles well
- ✅ Very difficult to manipulate

**Cons:**
- ❌ Much more complex to implement
- ❌ Harder to explain to participants
- ❌ Requires complete rankings from all voters

**Use Case**: Academic or formal competitions where mathematical rigor is important

---

### 6. **Instant Runoff / Ranked Choice** (Elimination-Based)
**How It Works**: Eliminates lowest-ranked teams in rounds until a winner emerges

**Pros:**
- ✅ Ensures majority support
- ✅ No wasted votes
- ✅ Handles multiple rounds well

**Cons:**
- ❌ Complex multi-round process
- ❌ Requires all votes before calculation
- ❌ May not work well with weighted voting

**Use Case**: Elections or competitions where majority consensus is critical

---

## Recommendations

### For Hackathons (Current Use Case)
**Best Option**: **Quadratic Borda Count**

**Why:**
1. Strongly rewards top performers (important for hackathons)
2. Better reflects judge/voter preference intensity
3. Reduces strategic voting impact
4. Still simple enough to explain
5. Works well with your existing weighted voting system

### Implementation Suggestion
Add a `ranking_method` field to polls with options:
- `linear` (current - Borda Count)
- `quadratic` (recommended)
- `exponential`
- `sqrt` (square root)
- `custom` (uses rank_points_config)

This allows flexibility while providing sensible defaults.

---

## Comparison Table

| Method | Top Position Weight | Complexity | Manipulation Resistance | Best For |
|--------|-------------------|------------|-------------------------|----------|
| **Linear (Current)** | Medium | Low | Low | General use |
| **Quadratic** | High | Low | Medium | Hackathons ⭐ |
| **Exponential** | Very High | Low | High | High-stakes |
| **Square Root** | Medium-High | Medium | Medium | Inclusive events |
| **Top-Heavy Custom** | Variable | Low | Medium | Specific goals |
| **Condorcet** | N/A | Very High | Very High | Academic |
| **Instant Runoff** | N/A | High | High | Elections |

---

## Code Implementation Example

```typescript
// Add to poll types
export type RankingMethod = 'linear' | 'quadratic' | 'exponential' | 'sqrt' | 'custom';

// Update calculation function
function calculatePoints(
  rank: number,
  numberOfTeams: number,
  method: RankingMethod = 'linear',
  rankPointsConfig?: RankPointsConfig
): number {
  // Custom config takes precedence
  if (rankPointsConfig && rankPointsConfig[rank.toString()] !== undefined) {
    return rankPointsConfig[rank.toString()];
  }
  
  const basePoints = numberOfTeams - rank + 1;
  
  switch (method) {
    case 'linear':
      return basePoints;
    case 'quadratic':
      return basePoints * basePoints;
    case 'exponential':
      return Math.pow(2, basePoints - 1);
    case 'sqrt':
      return Math.sqrt(basePoints) * numberOfTeams;
    case 'custom':
      return rankPointsConfig?.[rank.toString()] || 0;
    default:
      return basePoints;
  }
}
```

