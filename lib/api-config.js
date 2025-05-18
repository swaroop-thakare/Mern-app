// This file centralizes API configuration for the frontend

// Get the API URL from environment variables with a fallback
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api"

// Helper function for making authenticated API requests
const fetchWithAuth = async (endpoint, options = {}) => {
  // Get token from localStorage (client-side only)
  let token = null
  if (typeof window !== "undefined") {
    token = localStorage.getItem("token")
  }

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        ...options.headers,
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
      },
    })

    // Handle token expiration
    if (response.status === 401) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("token")
        window.location.href = "/" // Redirect to login
      }
    }

    return response
  } catch (error) {
    console.error(`Error fetching ${endpoint}:`, error)
    throw error
  }
}

// Export both the URL and the fetch helper
export { API_URL, fetchWithAuth }
