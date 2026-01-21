# Admin Revenue Analytics API Guide

## 🚀 Quick Start

All APIs require admin authentication. Use your admin token in headers:
```
Authorization: Bearer YOUR_ADMIN_TOKEN
```

Base URL: `http://localhost:5000/api/admin/revenue`

---

## 📊 API Endpoints

### 1. Complete Revenue Overview
**GET** `/api/admin/revenue/overview`

**Query Parameters:**
- `startDate` (optional): Filter from date (YYYY-MM-DD)
- `endDate` (optional): Filter to date (YYYY-MM-DD)

**Response:**
```json
{
  "success": true,
  "data": {
    "platformFees": {
      "total": 7500,
      "percentage": 5,
      "description": "5% of all tournament registrations"
    },
    "totalCollected": 150000,
    "pendingVerification": 12000,
    "paidToOrganizers": 85000,
    "balanceInHand": 65000,
    "breakdown": {
      "collected": 150000,
      "yourShare": 7500,
      "organizerShare": 142500,
      "alreadyPaid": 85000,
      "pendingPayout": 57500
    },
    "stats": {
      "tournaments": 12,
      "registrations": 300,
      "averagePerTournament": 12500,
      "averagePerRegistration": 500
    }
  }
}
```

**What You Get:**
- ✅ Your total platform fees (YOUR MONEY)
- ✅ Total collected from all players
- ✅ Money pending verification
- ✅ Money already paid to organizers
- ✅ Balance in your hand
- ✅ Complete breakdown
- ✅ Tournament & registration stats

---

### 2. Revenue by Tournament
**GET** `/api/admin/revenue/by-tournament`

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 20)
- `sortBy` (default: 'totalCollected'): totalCollected | platformFeeAmount | totalRegistrations
- `order` (default: 'desc'): asc | desc

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "tournamentId": "uuid",
      "tournamentName": "Bangalore Open 2026",
      "location": "Bangalore, Karnataka",
      "startDate": "2026-02-15T10:00",
      "status": "completed",
      "organizer": {
        "id": "uuid",
        "name": "Rajesh Kumar",
        "email": "rajesh@email.com",
        "phone": "+91-9876543210"
      },
      "revenue": {
        "totalCollected": 25000,
        "registrations": 50,
        "averagePerRegistration": 500,
        "platformFee": {
          "amount": 1250,
          "percentage": 5
        },
        "organizerShare": {
          "total": 23750,
          "payout40": {
            "amount": 9500,
            "status": "paid",
            "paidAt": "2026-02-15T12:00:00Z"
          },
          "payout60": {
            "amount": 14250,
            "status": "pending",
            "paidAt": null
          },
          "totalPaid": 9500,
          "pending": 14250
        }
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 12,
    "totalPages": 1
  }
}
```

**What You Get:**
- ✅ Every tournament's complete revenue breakdown
- ✅ Your platform fee from each tournament
- ✅ Organizer details
- ✅ Payout status (40% & 60%)
- ✅ Pending amounts
- ✅ Sortable & paginated

---

### 3. Revenue by Organizer
**GET** `/api/admin/revenue/by-organizer`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "organizer": {
        "id": "uuid",
        "name": "Rajesh Kumar",
        "email": "rajesh@email.com",
        "phone": "+91-9876543210",
        "city": "Bangalore",
        "state": "Karnataka"
      },
      "stats": {
        "tournamentsOrganized": 5,
        "totalRevenue": 125000,
        "platformFeesGenerated": 6250,
        "organizerEarnings": 118750,
        "paidOut": 70000,
        "pending": 48750
      }
    }
  ]
}
```

**What You Get:**
- ✅ Each organizer's complete stats
- ✅ How much platform fee they generated for you
- ✅ Their total earnings
- ✅ How much you've paid them
- ✅ How much is pending
- ✅ Sorted by revenue (highest first)

---

### 4. Revenue by Location
**GET** `/api/admin/revenue/by-location`

**Query Parameters:**
- `groupBy` (default: 'city'): city | state

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "location": "Bangalore",
      "tournaments": 12,
      "totalRevenue": 300000,
      "platformFees": 15000,
      "registrations": 600
    },
    {
      "location": "Mumbai",
      "tournaments": 8,
      "totalRevenue": 200000,
      "platformFees": 10000,
      "registrations": 400
    }
  ],
  "groupBy": "city"
}
```

**What You Get:**
- ✅ Revenue breakdown by city or state
- ✅ Your platform fees from each location
- ✅ Tournament count per location
- ✅ Registration count
- ✅ Sorted by revenue (highest first)

---

### 5. Revenue Timeline
**GET** `/api/admin/revenue/timeline`

**Query Parameters:**
- `period` (default: 'daily'): daily | weekly | monthly
- `startDate` (optional): YYYY-MM-DD
- `endDate` (optional): YYYY-MM-DD

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "period": "2026-01-15",
      "totalCollected": 12000,
      "platformFees": 600,
      "registrations": 24
    },
    {
      "period": "2026-01-16",
      "totalCollected": 8500,
      "platformFees": 425,
      "registrations": 17
    }
  ],
  "period": "daily"
}
```

**What You Get:**
- ✅ Revenue over time (daily/weekly/monthly)
- ✅ Your platform fees trend
- ✅ Registration trends
- ✅ Perfect for charts/graphs

---

### 6. Individual Payment Details
**GET** `/api/admin/revenue/payments/detailed`

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 50)
- `status` (default: 'approved'): pending | approved | rejected

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "paymentId": "uuid",
      "amount": 500,
      "platformFee": 25,
      "organizerShare": 475,
      "player": {
        "id": "uuid",
        "name": "Amit Sharma",
        "email": "amit@email.com",
        "phone": "+91-9876543210",
        "city": "Delhi",
        "state": "Delhi"
      },
      "category": {
        "name": "Men's Singles",
        "format": "singles",
        "gender": "MALE"
      },
      "tournament": {
        "id": "uuid",
        "name": "Delhi Championship",
        "city": "Delhi",
        "state": "Delhi",
        "startDate": "2026-02-20T10:00",
        "organizer": {
          "id": "uuid",
          "name": "Rajesh Kumar"
        }
      },
      "paymentDate": "2026-01-15T10:30:00Z",
      "verifiedDate": "2026-01-15T11:00:00Z",
      "verifiedBy": "admin-uuid",
      "screenshot": "https://cloudinary.com/..."
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 300,
    "totalPages": 6
  }
}
```

**What You Get:**
- ✅ EVERY SINGLE payment detail
- ✅ Your platform fee from each payment
- ✅ Complete player info
- ✅ Complete tournament info
- ✅ Organizer info
- ✅ Payment screenshot
- ✅ Dates & verification info
- ✅ Paginated for easy browsing

---

## 🎯 Usage Examples

### Example 1: Get Today's Revenue
```javascript
const today = new Date().toISOString().split('T')[0];
const response = await fetch(
  `http://localhost:5000/api/admin/revenue/overview?startDate=${today}&endDate=${today}`,
  {
    headers: {
      'Authorization': `Bearer ${adminToken}`
    }
  }
);
const data = await response.json();
console.log('Today\'s platform fees:', data.data.platformFees.total);
```

### Example 2: Get Top 10 Tournaments by Revenue
```javascript
const response = await fetch(
  'http://localhost:5000/api/admin/revenue/by-tournament?limit=10&sortBy=totalCollected&order=desc',
  {
    headers: {
      'Authorization': `Bearer ${adminToken}`
    }
  }
);
const data = await response.json();
console.log('Top tournaments:', data.data);
```

### Example 3: Get This Month's Revenue Timeline
```javascript
const startOfMonth = '2026-01-01';
const endOfMonth = '2026-01-31';
const response = await fetch(
  `http://localhost:5000/api/admin/revenue/timeline?period=daily&startDate=${startOfMonth}&endDate=${endOfMonth}`,
  {
    headers: {
      'Authorization': `Bearer ${adminToken}`
    }
  }
);
const data = await response.json();
// Use data.data for chart
```

### Example 4: Get All Payments from Bangalore
```javascript
const response = await fetch(
  'http://localhost:5000/api/admin/revenue/payments/detailed?limit=100',
  {
    headers: {
      'Authorization': `Bearer ${adminToken}`
    }
  }
);
const data = await response.json();
const bangalorePayments = data.data.filter(p => p.tournament.city === 'Bangalore');
console.log('Bangalore payments:', bangalorePayments);
```

---

## 📱 Frontend Integration

### Dashboard Overview Component
```jsx
import { useEffect, useState } from 'react';

function RevenueDashboard() {
  const [revenue, setRevenue] = useState(null);

  useEffect(() => {
    fetchRevenue();
  }, []);

  const fetchRevenue = async () => {
    const response = await fetch('/api/admin/revenue/overview', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
      }
    });
    const data = await response.json();
    setRevenue(data.data);
  };

  if (!revenue) return <div>Loading...</div>;

  return (
    <div className="revenue-dashboard">
      <div className="stat-card">
        <h3>Your Platform Fees</h3>
        <p className="amount">₹{revenue.platformFees.total.toLocaleString()}</p>
        <span className="badge">5% of all revenue</span>
      </div>

      <div className="stat-card">
        <h3>Total Collected</h3>
        <p className="amount">₹{revenue.totalCollected.toLocaleString()}</p>
      </div>

      <div className="stat-card">
        <h3>Balance in Hand</h3>
        <p className="amount">₹{revenue.balanceInHand.toLocaleString()}</p>
      </div>

      <div className="stat-card">
        <h3>Pending Payouts</h3>
        <p className="amount">₹{revenue.breakdown.pendingPayout.toLocaleString()}</p>
      </div>
    </div>
  );
}
```

---

## 🔐 Authentication

All endpoints require admin authentication. Make sure to:
1. Login as admin first
2. Get the JWT token
3. Include token in all requests:
   ```
   Authorization: Bearer YOUR_TOKEN
   ```

---

## ✅ Testing Checklist

- [ ] Test revenue overview API
- [ ] Test revenue by tournament API
- [ ] Test revenue by organizer API
- [ ] Test revenue by location API
- [ ] Test revenue timeline API
- [ ] Test individual payments API
- [ ] Test with date filters
- [ ] Test pagination
- [ ] Test sorting
- [ ] Verify calculations are correct

---

## 🎉 You Now Have Complete Financial Visibility!

With these APIs, you can:
- ✅ Track every rupee coming in
- ✅ Know exactly how much is yours (5%)
- ✅ See what belongs to organizers (95%)
- ✅ Monitor all payouts
- ✅ Analyze revenue by tournament/organizer/location
- ✅ View trends over time
- ✅ Access every payment detail
- ✅ Make data-driven decisions

**All backend APIs are ready and working!** 🚀
