# How to Run the TP Diagnostic Script

## Option 1: Run on Render (Recommended)

Since your database is on Render, the easiest way is to run the diagnostic there:

1. Go to your Render dashboard
2. Open your backend service
3. Click on "Shell" tab
4. Run:
```bash
node diagnose-scorejson.js
```

This will show you:
- How many completed GROUP matches exist
- Whether scoreJson is saved for each match
- What the scoreJson looks like
- What TP should be calculated as
- Where the problem is occurring

## Option 2: Run Locally (Requires DATABASE_URL)

If you want to run it locally:

1. Get your DATABASE_URL from Render:
   - Go to Render dashboard
   - Open your PostgreSQL database
   - Copy the "External Database URL"

2. Create a `.env` file in the backend folder:
```bash
cd backend
echo "DATABASE_URL=your-database-url-here" > .env
```

3. Run the diagnostic:
```bash
node diagnose-scorejson.js
```

## What the Output Will Tell You

### Scenario 1: No Completed Matches Found
```
Found 0 completed GROUP stage matches
❌ NO COMPLETED GROUP STAGE MATCHES FOUND
```
**Meaning:** No round-robin matches have been completed yet, OR matches are not marked with stage='GROUP'

### Scenario 2: Matches Exist But No scoreJson
```
Match 1 (ID: abc123...)
   ❌ scoreJson: NULL - NO SCORE DATA SAVED!
```
**Meaning:** Matches are being completed without saving scores. The match completion endpoint is not working correctly.

### Scenario 3: scoreJson Exists But Wrong Format
```
Match 1 (ID: abc123...)
   ✅ scoreJson exists (250 chars)
   ❌ PROBLEM: scoreJson has no sets array or it's empty!
```
**Meaning:** Scores are being saved but in the wrong format. Frontend is sending incorrect data.

### Scenario 4: scoreJson Valid But TP Still 0
```
Match 1 (ID: abc123...)
   ✅ scoreJson exists (250 chars)
   ✅ Score data is valid and can be calculated
   🎯 Total Points: Player1=42, Player2=33

Group A:
  Charlie: 2pts (1W-0L, 1P, TP:0)
  ❌ PROBLEM: All TP values are 0 even though matches have been played!
```
**Meaning:** scoreJson is correct, but getDraw() is not calculating TP properly. The calculation logic has a bug.

## After Running the Diagnostic

Share the output with me and I'll tell you exactly what needs to be fixed!

The diagnostic will pinpoint:
1. ✅ Whether scoreJson is being saved
2. ✅ What format the scoreJson is in
3. ✅ Whether TP calculation is running
4. ✅ Where the data is being lost

## Quick Check Without Running Script

You can also quickly check in your database directly:

```sql
SELECT 
  id, 
  matchNumber, 
  status, 
  stage,
  winnerId,
  CASE 
    WHEN scoreJson IS NULL THEN 'NULL'
    WHEN LENGTH(scoreJson) < 50 THEN scoreJson
    ELSE SUBSTRING(scoreJson, 1, 100) || '...'
  END as scoreJson_preview
FROM "Match"
WHERE status = 'COMPLETED' 
  AND stage = 'GROUP'
ORDER BY completedAt DESC
LIMIT 5;
```

This will show you if scoreJson is NULL or has data.
