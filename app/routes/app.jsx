import { Link, Outlet, useLoaderData, useRouteError } from "@remix-run/react";
import { boundary } from "@shopify/shopify-app-remix/server";
import { AppProvider } from "@shopify/shopify-app-remix/react";
import { NavMenu } from "@shopify/app-bridge-react";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";
import { authenticate } from "../shopify.server";

export const links = () => [{ 
  rel: "stylesheet", 
  href: polarisStyles,
  // Optimize CSS loading for Core Web Vitals
  crossOrigin: "anonymous"
}];

export const loader = async ({ request }) => {
  await authenticate.admin(request);

  return { 
    apiKey: process.env.SHOPIFY_API_KEY || "",
    // Add shop domain for better session management
    shop: new URL(request.url).searchParams.get("shop") || ""
  };
};

export default function App() {
  const { apiKey, shop } = useLoaderData();

  return (
    <AppProvider 
      isEmbeddedApp 
      apiKey={apiKey}
      // Enhanced App Bridge configuration for 2025 standards
      config={{
        apiKey,
        host: shop ? btoa(`${shop}/admin`) : undefined,
        forceRedirect: true
      }}
    >
      <NavMenu>
        <Link to="/app" rel="home">
          Bulk Tag Editor
        </Link>
        <Link to="/app/products">Product Browser</Link>
      </NavMenu>
      <Outlet />
    </AppProvider>
  );
}

// Enhanced error boundary for better UX
export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

// Optimized headers for performance
export const headers = (headersArgs) => {
  const headers = boundary.headers(headersArgs);
  
  // Add performance headers
  headers.set("Cache-Control", "public, max-age=300, s-maxage=3600");
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("X-Frame-Options", "ALLOWALL"); // Required for Shopify embedding
  
  return headers;
};
