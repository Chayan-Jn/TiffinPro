# Phase 2 Testing Checklist

Run through these steps to ensure the Meal Management & Deliveries features are completely solid before we move on to Billing and Accounts (Phase 3).


### 1. Provider Menu Upload (`/provider/menu`)

* **Upload a New Image:** 
  Click the upload box and select an image (JPG/PNG/WebP). Verify it uploads and displays the image instantly.

* **Verify Persistence:** 
  Refresh the page. Verify the "Loading image..." text appears briefly, and then your uploaded image successfully loads.

* **Replace Image:** 
  Without removing the current image, click the box and upload a *different* image. Verify the new image instantly replaces the old one.

* **Remove Image:** 
  Click the red **✕** button on the image. Verify the image disappears and the "No image uploaded yet" message appears.

* **Check Backblaze (Optional):** 
  Check your Backblaze B2 `menus` folder. You should see exactly one file named `yourusername_menu.extension` that overwrites itself, not a new file every time.


### 2. Daily Text Menu (`/provider/menu`)

* **Save Today's Menu:** 
  Type some food items into Breakfast and Lunch. Leave Dinner empty. Click **Save Daily Menu**.

* **Verify Persistence:** 
  Refresh the page. Ensure Breakfast and Lunch are still there, and the empty Dinner row was cleanly ignored.

* **Future Dates:** 
  Change the date picker to tomorrow. Verify the inputs clear out so you can set tomorrow's menu.


### 3. Customer Meal Plans (`/provider/customers`)

* **Edit Customer Plan:** 
  Go to Customers, click Edit on an existing customer.

* **Set Plan Details:** 
  Set Plan Type to `Monthly Fixed`, Rate to `2500`, Start Date to Today, and Meals to `Breakfast, Lunch` (deliberately omit Dinner).

* **Save:** 
  Click Save Changes and verify the customer card updates.


### 4. Tracking Deliveries (`/provider/deliveries`)

* **Check Filtering:** 
  Select **Date:** Today, **Meal:** `Lunch`. Your edited customer should appear in the "Pending" list.

* **Check Exclusions:** 
  Change **Meal** to `Dinner`. The customer should *not* appear (because they only subscribed to Breakfast and Lunch).

* **Mark Delivered:** 
  Go back to `Lunch` and click the green **✅ Mark X Delivered** button. Verify their status turns green.

* **Manual Override:** 
  Click the individual **Cancel** button on a customer to verify you can manually override their status.


### 5. Customer Dashboard (`/customer/home`)

* **Login:** 
  Open an incognito window and log in as the Customer.

* **View Menu Drawer:** 
  Click the **View Menu** button on the Provider's card.

* **Verify Image & Menu:** 
  Ensure the provider's uploaded photo loads correctly and fits within the screen. Ensure the specific text menu (e.g., your Breakfast and Lunch items) is visible.

* **Verify Overdue Warning:** *(Optional)* 
  Go back to the Provider window, edit the customer, and set their End Date to yesterday. Refresh the Customer window and verify the red **Overdue** warning box appears.


---

Once you've tested these out, let me know and we will jump straight into Phase 3!
