## Installation

Before you can use the `enhancedFetch` library, ensure it's installed and imported into your project:

```javascript
// Assuming the library is named 'enhanced-fetch'
import { enhancedFetch } from "enhanced-fetch";
```

## Basic Usage

At its simplest, the `enhancedFetch` function can be used similarly to the native fetch, but with added enhancements.

```javascript
enhancedFetch("https://api.example.com/data")
  .then((data) => {
    console.log(data);
  })
  .catch((error) => {
    console.error("An error occurred:", error);
  });
```

## Using with Options

The real power of `enhancedFetch` comes from its additional options:

### Sending JSON Data

Automatically sets the `Content-Type` header to `application/json` and serializes your data object into a JSON string.

```javascript
enhancedFetch("https://api.example.com/submit", {
  method: "POST",
  data: { key: "value" },
})
  .then((response) => {
    console.log("Data submitted:", response);
  })
  .catch((error) => {
    console.error("Submitting data failed:", error);
  });
```

### Query Parameters

Automatically serializes an object into a query string and appends it to the URL.

```javascript
enhancedFetch("https://api.example.com/search", {
  params: { query: "enhancedFetch", page: 1 },
})
  .then((results) => {
    console.log("Search results:", results);
  })
  .catch((error) => {
    console.error("Search failed:", error);
  });
```

### Setting a Timeout

Specify a maximum time to wait for the response.

```javascript
enhancedFetch("https://api.example.com/data", {
  timeout: 5000, // Timeout after 5000ms or 5 seconds
})
  .then((data) => {
    console.log(data);
  })
  .catch((error) => {
    if (error.name === "AbortError") {
      console.error("Request timed out");
    } else {
      console.error("An error occurred:", error);
    }
  });
```

## Interceptors

Interceptors allow you to run custom code before a request is made or after a response is received.

### Before Interceptor

Modify or log the request before it is sent.

```javascript
const beforeInterceptor = async (url, options) => {
  // Modify the URL or options here
  console.log(`Making request to ${url}`);
  return { url, options };
};

enhancedFetch("https://api.example.com/data", { beforeInterceptor });
```

### After Interceptor

Handle or modify the response data before it is returned from the `enhancedFetch` call.

```javascript
const afterInterceptor = async (response, json) => {
  // Check for specific conditions or modify the response here
  if (!response.ok) {
    console.error(`Received a non-OK status: ${response.status}`);
  }
  return json; // Return the modified or original JSON
};

enhancedFetch("https://api.example.com/data", { afterInterceptor });
```

## Error Handling

The `EnhancedFetchError` class provides additional information about HTTP response status, allowing for more nuanced error handling.

```javascript
enhancedFetch("https://api.example.com/secure-data", {
  method: "GET",
})
  .then((data) => {
    console.log("Secure data:", data);
  })
  .catch((error) => {
    if (error instanceof EnhancedFetchError && error.status) {
      console.error(`Error ${error.status}: ${error.statusText}`); // Status != 2xx
    } else if (error instanceof EnhancedFetchError) {
      console.error(error.message);
    }
  });
```
