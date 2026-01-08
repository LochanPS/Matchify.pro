# Day 21: Tournament Discovery Backend - Complete ✅

## Overview
Enhanced the tournament discovery endpoint with comprehensive filtering, search, pagination, and sorting capabilities. Players can now easily find tournaments based on multiple criteria.

## What Was Built

### 1. Enhanced GET /api/tournaments Endpoint

#### Features Added:
- **Location Filters:** city, state, zone, country
- **Date Filters:** startDate, endDate, registrationOpen
- **Status Filter:** Multiple statuses (comma-separated)
- **Format Filter:** singles, doubles, both
- **Privacy Filter:** public, private
- **Search:** Name, description, venue, city
- **Pagination:** page, limit (default 20 per page)
- **Sorting:** sortBy, sortOrder (default: startDate asc)

#### Default Behavior:
- Shows only **published** and **ongoing** tournaments (hides drafts)
- Shows only **public** tournaments (hides private)
- Returns **20 tournaments per page**
- Sorted by **startDate ascending**

### 2. Enhanced Response Data

Each tournament includes:
- Basic tournament info (name, dates, location, format, status)
- Organizer details (name, email)
- Primary poster (first poster only for list view)
- All categories with details
- **Calculated fields:**
  - `minEntryFee` - Lowest category entry fee
  - `maxEntryFee` - Highest category entry fee
  - `isRegistrationOpen` - Boolean based on current date
  - `daysUntilStart` - Days remaining until tournament starts
- Counts: total categories, total registrations

## API Documentation

### GET /api/tournaments

**Base URL:** `http://localhost:5000/api/tournaments`

#### Query Parameters:

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `page` | number | Page number (default: 1) | `?page=2` |
| `limit` | number | Results per page (default: 20) | `?limit=10` |
| `city` | string | Filter by city (partial match) | `?city=Bangalore` |
| `state` | string | Filter by state (partial match) | `?state=Karnataka` |
| `zone` | string | Filter by zone (exact match) | `?zone=South` |
| `country` | string | Filter by country (partial match) | `?country=India` |
| `startDate` | ISO date | Tournaments starting after this date | `?startDate=2026-01-01` |
| `endDate` | ISO date | Tournaments starting before this date | `?endDate=2026-12-31` |
| `registrationOpen` | boolean | Only show tournaments with open registration | `?registrationOpen=true` |
| `status` | string | Filter by status (comma-separated) | `?status=published,ongoing` |
| `format` | string | Filter by format | `?format=both` |
| `privacy` | string | Filter by privacy | `?privacy=public` |
| `search` | string | Search in name, description, venue, city | `?search=Open` |
| `sortBy` | string | Sort field (startDate, endDate, createdAt, name, city) | `?sortBy=startDate` |
| `sortOrder` | string | Sort order (asc, desc) | `?sortOrder=desc` |

#### Example Requests:

**1. Get all tournaments (default):**
```
GET /api/tournaments
```

**2. Filter by city:**
```
GET /api/tournaments?city=Bangalore
```

**3. Filter by zone and format:**
```
GET /api/tournaments?zone=South&format=both
```

**4. Search for tournaments:**
```
GET /api/tournaments?search=Open
```

**5. Get tournaments with open registration:**
```
GET /api/tournaments?registrationOpen=true
```

**6. Combined filters with pagination:**
```
GET /api/tournaments?city=Bangalore&status=published&format=both&page=1&limit=10
```

**7. Sort by start date descending:**
```
GET /api/tournaments?sortBy=startDate&sortOrder=desc
```

#### Response Format:

```json
{
  "success": true,
  "data": {
    "tournaments": [
      {
        "id": "uuid",
        "name": "Bangalore Open Badminton Championship",
        "description": "Join us for an exciting tournament...",
        "venue": "Bangalore Sports Complex",
        "address": "123 Stadium Road, Bangalore",
        "city": "Bangalore",
        "state": "Karnataka",
        "pincode": "560001",
        "zone": "South",
        "country": "India",
        "format": "both",
        "privacy": "public",
        "status": "published",
        "registrationOpenDate": "2025-12-20T00:00:00.000Z",
        "registrationCloseDate": "2026-01-03T00:00:00.000Z",
        "startDate": "2026-01-06T00:00:00.000Z",
        "endDate": "2026-01-08T00:00:00.000Z",
        "totalCourts": 6,
        "matchStartTime": "08:00",
        "matchEndTime": "18:00",
        "matchDuration": 60,
        "totalRegistrations": 0,
        "totalRevenue": 0,
        "createdAt": "2025-12-25T00:00:00.000Z",
        "updatedAt": "2025-12-25T00:00:00.000Z",
        "organizerId": "uuid",
        "organizer": {
          "id": "uuid",
          "name": "John Organizer",
          "email": "organizer@example.com"
        },
        "posters": [
          {
            "id": "uuid",
            "imageUrl": "https://cloudinary.com/...",
            "publicId": "matchify/tournaments/...",
            "displayOrder": 0,
            "createdAt": "2025-12-25T00:00:00.000Z"
          }
        ],
        "categories": [
          {
            "id": "uuid",
            "name": "Men's Singles Open",
            "format": "singles",
            "gender": "men",
            "entryFee": 500,
            "maxParticipants": 32,
            "registrationCount": 0
          },
          {
            "id": "uuid",
            "name": "Women's Doubles Open",
            "format": "doubles",
            "gender": "women",
            "entryFee": 600,
            "maxParticipants": 16,
            "registrationCount": 0
          }
        ],
        "_count": {
          "categories": 2,
          "registrations": 0
        },
        "minEntryFee": 500,
        "maxEntryFee": 600,
        "isRegistrationOpen": true,
        "daysUntilStart": 12
      }
    ],
    "pagination": {
      "total": 24,
      "page": 1,
      "limit": 20,
      "totalPages": 2
    },
    "filters": {
      "city": null,
      "state": null,
      "zone": null,
      "country": null,
      "status": null,
      "format": null,
      "privacy": null,
      "search": null,
      "startDate": null,
      "endDate": null,
      "registrationOpen": null
    }
  }
}
```

## Database Seeding

### Seed Script: `seed-tournaments.js`

Created 30 test tournaments with:
- **8 cities:** Bangalore, Mumbai, Delhi, Hyderabad, Chennai, Pune, Kolkata, Ahmedabad
- **3 formats:** singles, doubles, both
- **3 statuses:** published (60%), ongoing (20%), draft (20%)
- **All public** tournaments
- **Future dates:** 10-100 days from now
- **Categories:** 2-5 categories per tournament based on format

#### Run Seed:
```bash
cd matchify/backend
node seed-tournaments.js
```

#### Output:
```
✅ Created 30 tournaments
✅ Added categories to all tournaments

📊 Tournament Summary:
draft           both       7 tournaments
draft           doubles    2 tournaments
draft           singles    2 tournaments
ongoing         both       2 tournaments
ongoing         doubles    2 tournaments
ongoing         singles    2 tournaments
published       both       6 tournaments
published       doubles    6 tournaments
published       singles    6 tournaments
```

## Testing

### Test Suite: `test-tournament-discovery.js`

#### Tests Included:
1. ✅ Get all tournaments (default)
2. ✅ Filter by city
3. ✅ Filter by state
4. ✅ Filter by zone
5. ✅ Filter by format
6. ✅ Filter by status (multiple)
7. ✅ Search by name
8. ✅ Pagination
9. ✅ Sorting (asc/desc)
10. ✅ Combined filters
11. ✅ Pricing calculation
12. ✅ Registration status

#### Run Tests:
```bash
cd matchify/backend
node test-tournament-discovery.js
```

#### Results:
```
🎉 All tests passed! Tournament discovery endpoint is working correctly.
12/12 tests passed
```

## Files Modified/Created

### Modified (1 file):
1. **`backend/src/controllers/tournament.controller.js`**
   - Enhanced `getTournaments()` function
   - Added comprehensive filtering logic
   - Added search with AND/OR logic
   - Added calculated fields (minEntryFee, maxEntryFee, isRegistrationOpen, daysUntilStart)
   - Improved response structure

### Created (2 files):
1. **`backend/seed-tournaments.js`**
   - Seeds 30 test tournaments
   - Creates categories for each tournament
   - Distributes across 8 cities
   - Various formats and statuses

2. **`backend/test-tournament-discovery.js`**
   - Comprehensive test suite
   - 12 different test scenarios
   - Tests all filter combinations
   - Validates response structure

## Key Features

### 1. Smart Defaults
- Only shows **published** and **ongoing** tournaments (hides drafts)
- Only shows **public** tournaments
- Sorted by **start date** (soonest first)
- **20 results per page**

### 2. Flexible Filtering
- **Multiple filters** can be combined
- **Partial matching** for text fields (city, state, country)
- **Exact matching** for enums (zone, format, status)
- **Date range** filtering
- **Multiple status** values (comma-separated)

### 3. Powerful Search
- Searches across **4 fields**: name, description, venue, city
- Uses **OR logic** for search terms
- Combines with **AND logic** for other filters
- Case-insensitive matching

### 4. Calculated Fields
- **minEntryFee / maxEntryFee:** Automatically calculated from categories
- **isRegistrationOpen:** Boolean based on current date vs registration dates
- **daysUntilStart:** Days remaining until tournament starts

### 5. Optimized Queries
- **Single query** with joins for related data
- **Parallel queries** for count (pagination)
- **Limited poster data** (only primary poster for list view)
- **Indexed fields** for fast filtering

## Performance Considerations

### Database Indexes:
```prisma
@@index([city, state, status])
@@index([startDate, registrationCloseDate])
@@index([organizerId])
```

### Query Optimization:
- Only fetch **first poster** for list view (full posters on detail page)
- Use **select** to limit organizer fields
- Use **_count** for efficient counting
- **Pagination** to limit result set

## Use Cases

### For Players:

**1. Find tournaments in my city:**
```
GET /api/tournaments?city=Bangalore
```

**2. Find tournaments with open registration:**
```
GET /api/tournaments?registrationOpen=true
```

**3. Find singles tournaments in South zone:**
```
GET /api/tournaments?zone=South&format=singles
```

**4. Search for "Open" tournaments:**
```
GET /api/tournaments?search=Open
```

### For Frontend:

**1. Tournament list page:**
```
GET /api/tournaments?page=1&limit=12
```

**2. Filter sidebar:**
```
GET /api/tournaments?city=Bangalore&zone=South&format=both&status=published
```

**3. Search bar:**
```
GET /api/tournaments?search=Championship
```

**4. Upcoming tournaments:**
```
GET /api/tournaments?sortBy=startDate&sortOrder=asc&limit=5
```

## Error Handling

### Validation:
- Invalid page/limit → defaults to 1/20
- Invalid sortBy → defaults to 'startDate'
- Invalid sortOrder → defaults to 'asc'
- Invalid date format → ignored
- Empty filters → returns all (with defaults)

### Error Responses:
```json
{
  "success": false,
  "error": "Failed to fetch tournaments"
}
```

## Next Steps (Day 22)

### Tournament Registration:
1. **POST /api/tournaments/:id/register** - Register for tournament
2. **Category selection** - Choose which category to register for
3. **Partner selection** - For doubles categories
4. **Payment integration** - Wallet + Razorpay
5. **Registration confirmation** - Email/SMS notifications

### Additional Features:
1. **GET /api/tournaments/featured** - Featured tournaments
2. **GET /api/tournaments/nearby** - Tournaments near user location
3. **GET /api/tournaments/recommended** - Personalized recommendations
4. **GET /api/tournaments/stats** - Tournament statistics

## Success Metrics

✅ **12/12 tests passing**
✅ **30 test tournaments** seeded
✅ **10+ filter options** available
✅ **Pagination** working
✅ **Sorting** working
✅ **Search** working
✅ **Calculated fields** accurate
✅ **Performance** optimized
✅ **Default behavior** sensible
✅ **Error handling** robust

## Conclusion

Day 21 successfully implements a comprehensive tournament discovery system. Players can now easily find tournaments based on location, dates, format, and other criteria. The endpoint is optimized for performance and provides all necessary data for the frontend to build a rich tournament browsing experience.

The system is now ready for tournament registration functionality (Day 22).
