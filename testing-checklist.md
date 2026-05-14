# Phase 3 Testing Checklist

Run through these steps to ensure the Billing, Meal Quotas, and Payment tracking features are completely solid before we consider this ready for production.

### 1. Provider Payment Settings (`/provider/settings`)

* **Setup UPI Details:**
  Log in as a Provider. Navigate to Settings.
  Enter a UPI ID (e.g. `9876543210@ybl`) and upload a Payment QR Code. 
  Click "Save Payment Settings".

* **Verify Persistence:**
  Refresh the page to ensure the UPI ID and QR code load correctly from Backblaze B2.

### 2. Meal Quota & Auto-Calculations (`/provider/customers`)

* **Edit Customer Plan:**
  Go to Customers, click Edit on an existing customer.
  Ensure Plan Type is `Monthly Fixed` and Rate is `3000`.
  Set Start Date to today, and End Date exactly 1 month from now.

* **Verify Quota:**
  Save the customer. The system should automatically calculate `mealQuota`. (e.g., 30 days × 2 meals/day = 60 quota).

### 3. Tiffin Delivery Integration (`/provider/deliveries`)

* **Mark Delivered:**
  Go to Deliveries. Mark the customer's Lunch as **Delivered**. 

* **Verify Quota Depletion:**
  Go back to the Customers dashboard or Billing dashboard and verify their `mealsConsumed` incremented by 1 (e.g. `Quota: 1 / 60`).

* **Undo Delivery:**
  Go back to Deliveries and click **Undo** on that delivery.
  Verify the customer's `mealsConsumed` correctly decrements back to 0.

### 4. Bill Generation (`/provider/billing`)

* **Force Overdue:**
  To test billing, edit the customer again and set their End Date to yesterday so their Quota becomes 0, or artificially force `mealsConsumed` higher.
  Go to the Billing dashboard. They should appear under **Overdue Customers**.

* **Generate Bill:**
  Click the **Generate Bills** button. 
  Verify the customer moves from Overdue Customers to **Pending Invoices**.

### 5. Customer Payment Flow (`/customer/home` & `/customer/billing`)

* **Verify Notification:**
  Open an incognito window and log in as the Customer.
  Check the home dashboard for the red 💳 **Unpaid Bill alert**.

* **Upload Proof:**
  Click the alert to go to the Billing page. 
  Verify the Provider's UPI ID and QR code are visible.
  Upload a dummy screenshot as "Payment Proof".
  Verify the invoice state changes to "Verifying" or "Proof uploaded successfully".

### 6. Provider Verification (`/provider/billing`)

* **Approve Payment:**
  Switch back to the Provider window.
  The invoice should now be in the **⚠️ Verification Queue**.
  Click the image thumbnail to verify the proof opens.
  Click **Verify & Approve**.

* **Verify Renewal:**
  The invoice should move to "Past Payments" / Paid.
  Check the Customer's record: their `mealsConsumed` should be reset to `0`, and their Start/End Dates should be automatically shifted forward by 1 month for the new billing cycle!

### 7. Auto-Relinking (`/customer/home`)

* **Unsubscribe:**
  As the Customer, click "Remove" on the provider card to unsubscribe.

* **Re-Subscribe:**
  Click "+ Find Provider" and search for them again.
  Subscribe. 
  Verify that instead of creating a duplicate record, the system instantly reconnects you to your exact previous manual record, restoring all your meal plans and history.

---

Once you've tested these out, let me know!
