# Forms Integration Guide

This document explains how forms from the Postman collection are integrated into the admin panel.

## Overview

The admin panel integrates all form endpoints from the OptyShop API Postman collection, including:
- **Public Form Configs** - Get form configurations (fields, validation, etc.)
- **Public Form Submissions** - Submit forms from the website
- **Admin Form Requests** - View and manage form submissions

## Form Types

The system supports 6 form types:

1. **Contact Form** - General contact inquiries
2. **Demo Form** - Request product demos
3. **Pricing Form** - Request pricing information
4. **Job Application Form** - Submit job applications
5. **Credentials Form** - Request platform access credentials
6. **Support Form** - Submit support requests (with file attachments)

## API Endpoints

### Public Form Endpoints (No Auth Required)

#### Get Form Config
```javascript
GET /api/forms/{formType}
// Examples:
GET /api/forms/contact
GET /api/forms/demo
GET /api/forms/pricing
GET /api/forms/job-application
GET /api/forms/credentials
GET /api/forms/support
```

#### Submit Form
```javascript
POST /api/forms/{formType}/submissions
// Examples:
POST /api/forms/contact/submissions
POST /api/forms/demo/submissions
POST /api/forms/support/submissions (supports file uploads)
```

### Admin Form Request Endpoints (Admin Auth Required)

#### List Requests
```javascript
GET /api/admin/requests/{requestType}?page=1&limit=10&search=...
// Examples:
GET /api/admin/requests/contact
GET /api/admin/requests/demo
GET /api/admin/requests/pricing
GET /api/admin/requests/credentials
GET /api/admin/requests/support
```

#### Get Request by ID
```javascript
GET /api/admin/requests/{requestType}/{id}
// Example:
GET /api/admin/requests/contact/1
```

#### Delete Request
```javascript
DELETE /api/admin/requests/{requestType}/{id}
// Example:
DELETE /api/admin/requests/contact/1
```

## Using Form Utilities

### Get Form Configuration

```javascript
import { getFormConfig, FORM_TYPES } from '../utils/formUtils';

// Get contact form config
const config = await getFormConfig(FORM_TYPES.CONTACT);
console.log(config.fields); // Array of form fields
```

### Submit a Form

```javascript
import { submitForm, prepareFormData, FORM_TYPES } from '../utils/formUtils';

// Simple form submission (JSON)
const formData = {
  email: 'user@example.com',
  firstName: 'John',
  lastName: 'Doe',
  message: 'Hello, I need help...',
};

const result = await submitForm(FORM_TYPES.CONTACT, formData);

// Form with file uploads (FormData)
const formDataWithFiles = {
  email: 'user@example.com',
  firstName: 'John',
  attachments: [file1, file2], // File objects
};

const preparedData = prepareFormData(formDataWithFiles, ['attachments']);
const result = await submitForm(FORM_TYPES.SUPPORT, preparedData);
```

### Validate Form Data

```javascript
import { validateFormData, getFormConfig, FORM_TYPES } from '../utils/formUtils';

const config = await getFormConfig(FORM_TYPES.CONTACT);
const formData = {
  email: 'user@example.com',
  firstName: 'John',
  // ... other fields
};

const validation = validateFormData(formData, config);
if (!validation.isValid) {
  console.error('Validation errors:', validation.errors);
}
```

### Admin: Get Form Requests

```javascript
import { getFormRequests, getFormRequestById, deleteFormRequest } from '../utils/formUtils';

// Get all contact requests with pagination
const { requests, pagination } = await getFormRequests('contact', {
  page: 1,
  limit: 20,
  search: 'john@example.com',
});

// Get specific request
const request = await getFormRequestById('contact', 1);

// Delete request
await deleteFormRequest('contact', 1);
```

## Form Request Pages

The admin panel includes dedicated pages for managing form requests:

- `/forms/contact` - ContactRequests component
- `/forms/demo` - DemoRequests component
- `/forms/pricing` - PricingRequests component
- `/forms/credentials` - CredentialsRequests component
- `/forms/support` - SupportRequests component
- `/forms/job-applications` - JobApplications component

### Example: Contact Requests Page

```javascript
import ContactRequests from './pages/forms/ContactRequests';

// The component handles:
// - Fetching requests from API_ROUTES.ADMIN.CONTACT_REQUESTS.LIST
// - Displaying requests in a table
// - Showing request details in a drawer
// - Deleting requests
```

## Form Data Structures

### Contact Form
```json
{
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "country": "USA",
  "company": "Example Corp",
  "message": "I'm interested in your products"
}
```

### Demo Form
```json
{
  "email": "user@example.com",
  "name": "John Doe",
  "company": "Example Corp",
  "teamSize": "10-50",
  "focus": "ecommerce"
}
```

### Support Form (with attachments)
```javascript
// FormData format
{
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "phoneNumber": "+1 234 567 8900",
  "solutionsConcerned": ["virtual-try-on", "digital-frames"], // JSON string in FormData
  "message": "I need help with integration",
  "attachments": [File, File] // Up to 5 files, 100MB max per file
}
```

### Job Application Form
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "phoneNumber": "+33 1 23 45 67 89",
  "linkedInProfile": "https://linkedin.com/in/johndoe",
  "portfolioWebsite": "https://johndoe.com",
  "resumeCv": "https://example.com/resume.pdf",
  "coverLetterFile": "https://example.com/cover-letter.pdf",
  "whyJoinMessage": "I am passionate about...",
  "jobId": 102
}
```

## API Routes Reference

All form routes are defined in `src/config/apiRoutes.js`:

```javascript
import { API_ROUTES } from '../config/apiRoutes';

// Public form configs
API_ROUTES.FORMS.CONTACT.CONFIG
API_ROUTES.FORMS.DEMO.CONFIG
API_ROUTES.FORMS.PRICING.CONFIG
API_ROUTES.FORMS.JOB_APPLICATION.CONFIG
API_ROUTES.FORMS.CREDENTIALS.CONFIG
API_ROUTES.FORMS.SUPPORT.CONFIG

// Public form submissions
API_ROUTES.FORMS.CONTACT.SUBMIT
API_ROUTES.FORMS.DEMO.SUBMIT
// ... etc

// Admin form requests
API_ROUTES.ADMIN.CONTACT_REQUESTS.LIST
API_ROUTES.ADMIN.CONTACT_REQUESTS.BY_ID(id)
API_ROUTES.ADMIN.CONTACT_REQUESTS.DELETE(id)
// ... similar for other request types
```

## Components

### SubmissionsTable
Reusable table component for displaying form submissions.

```javascript
import SubmissionsTable from '../components/SubmissionsTable';

<SubmissionsTable
  data={requests}
  columns={columns}
  loading={loading}
  pagination={pagination}
  onPageChange={handlePageChange}
  onRowClick={handleRowClick}
  emptyMessage="No requests found."
/>
```

### SubmissionDrawer
Drawer component for viewing detailed submission information.

```javascript
import SubmissionDrawer from '../components/SubmissionDrawer';

<SubmissionDrawer
  isOpen={drawerOpen}
  onClose={handleClose}
  title={`Contact Request #${id}`}
  data={requestData}
  fields={drawerFields}
  formType="Contact Request"
/>
```

## Best Practices

1. **Use Form Utilities** - Always use `formUtils.js` functions instead of calling API directly
2. **Validate Before Submit** - Use `validateFormData()` before submitting forms
3. **Handle File Uploads** - Use `prepareFormData()` for forms with file attachments
4. **Error Handling** - Always wrap form operations in try-catch blocks
5. **Loading States** - Show loading indicators during form operations
6. **User Feedback** - Use toast notifications for success/error messages

## Error Handling

```javascript
import toast from 'react-hot-toast';

try {
  const result = await submitForm(FORM_TYPES.CONTACT, formData);
  toast.success('Form submitted successfully!');
} catch (error) {
  if (error.response?.status === 400) {
    toast.error('Please check your form data');
  } else if (error.response?.status === 429) {
    toast.error('Too many requests. Please try again later.');
  } else {
    toast.error('Failed to submit form. Please try again.');
  }
}
```

## Related Files

- `src/utils/formUtils.js` - Form utility functions
- `src/config/apiRoutes.js` - API route definitions
- `src/pages/forms/*` - Form request management pages
- `src/components/SubmissionsTable.jsx` - Reusable submissions table
- `src/components/SubmissionDrawer.jsx` - Reusable submission drawer
- `OptyShop_API.postman_collection.json` - Complete API collection

## Testing Forms

To test form submissions:

1. **Get Form Config** - First fetch the form configuration to see required fields
2. **Prepare Data** - Create form data matching the config structure
3. **Validate** - Validate data before submission
4. **Submit** - Submit the form
5. **View in Admin** - Check the admin panel to see the submission

Example test flow:

```javascript
// 1. Get config
const config = await getFormConfig(FORM_TYPES.CONTACT);

// 2. Prepare data
const formData = {
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  message: 'Test message',
};

// 3. Validate
const validation = validateFormData(formData, config);
if (!validation.isValid) {
  console.error(validation.errors);
  return;
}

// 4. Submit
const result = await submitForm(FORM_TYPES.CONTACT, formData);
console.log('Submission successful:', result);
```

