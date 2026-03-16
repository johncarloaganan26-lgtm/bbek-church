// vite.config.js
import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "file:///C:/Users/John%20Carlo/OneDrive/Desktop/bbek-app/fe/node_modules/vite/dist/node/index.js";
import vue from "file:///C:/Users/John%20Carlo/OneDrive/Desktop/bbek-app/fe/node_modules/@vitejs/plugin-vue/dist/index.mjs";
import vuetify from "file:///C:/Users/John%20Carlo/OneDrive/Desktop/bbek-app/fe/node_modules/vite-plugin-vuetify/dist/index.mjs";
import { loadEnv } from "file:///C:/Users/John%20Carlo/OneDrive/Desktop/bbek-app/fe/node_modules/vite/dist/node/index.js";
var __vite_injected_original_import_meta_url = "file:///C:/Users/John%20Carlo/OneDrive/Desktop/bbek-app/fe/vite.config.js";
var vite_config_default = defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const backendURL = "http://localhost:5000";
  console.log("\u{1F527} Vite Configuration:");
  console.log("   Frontend URL: http://localhost:5174");
  console.log("   Backend API URL:", backendURL);
  console.log("   Proxy: /api \u2192", backendURL);
  return {
    plugins: [
      vue(),
      vuetify({ autoImport: true })
    ],
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", __vite_injected_original_import_meta_url))
      }
    },
    server: {
      host: "0.0.0.0",
      // This allows access from any IP address
      port: 5174,
      // You can specify a port if needed
      proxy: {
        "/api": {
          target: backendURL,
          changeOrigin: true,
          secure: false,
          configure: (proxy, _options) => {
            proxy.on("error", (err, req, res) => {
              console.error("\u274C Proxy Error:", err.message);
              console.error("   Target URL:", backendURL);
              console.error("   Request URL:", req.url);
              if (err.code === "ECONNREFUSED") {
                console.error("   \u26A0\uFE0F  Connection Refused - Backend server is not running!");
                console.error("   \u{1F4A1} Make sure the backend is running on:", backendURL);
                console.error("   \u{1F4A1} Start backend with: cd church-be && npm run dev");
              }
              if (!res.headersSent) {
                res.writeHead(500, {
                  "Content-Type": "application/json"
                });
                res.end(JSON.stringify({
                  error: "Proxy Error",
                  message: err.code === "ECONNREFUSED" ? "Backend server is not running. Please start the backend server." : err.message,
                  target: backendURL
                }));
              }
            });
            proxy.on("proxyReq", (proxyReq, req, _res) => {
              console.log("\u{1F4E4} Sending Request to:", req.method, req.url, "\u2192", backendURL + req.url);
            });
            proxy.on("proxyRes", (proxyRes, req, _res) => {
              console.log("\u{1F4E5} Received Response:", req.method, req.url, "Status:", proxyRes.statusCode);
            });
          }
        }
      }
    }
  };
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxKb2huIENhcmxvXFxcXE9uZURyaXZlXFxcXERlc2t0b3BcXFxcYmJlay1hcHBcXFxcZmVcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXEpvaG4gQ2FybG9cXFxcT25lRHJpdmVcXFxcRGVza3RvcFxcXFxiYmVrLWFwcFxcXFxmZVxcXFx2aXRlLmNvbmZpZy5qc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovVXNlcnMvSm9obiUyMENhcmxvL09uZURyaXZlL0Rlc2t0b3AvYmJlay1hcHAvZmUvdml0ZS5jb25maWcuanNcIjtpbXBvcnQgeyBmaWxlVVJMVG9QYXRoLCBVUkwgfSBmcm9tICdub2RlOnVybCdcbmltcG9ydCB7IGRlZmluZUNvbmZpZyB9IGZyb20gJ3ZpdGUnXG5pbXBvcnQgdnVlIGZyb20gJ0B2aXRlanMvcGx1Z2luLXZ1ZSdcbmltcG9ydCB2dWV0aWZ5IGZyb20gJ3ZpdGUtcGx1Z2luLXZ1ZXRpZnknXG5pbXBvcnQgeyBsb2FkRW52IH0gZnJvbSAndml0ZSdcblxuLy8gaHR0cHM6Ly92aXRlLmRldi9jb25maWcvXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoKHsgbW9kZSB9KSA9PiB7XG4gIC8vIExvYWQgZW52IGZpbGUgYmFzZWQgb24gYG1vZGVgIGluIHRoZSBjdXJyZW50IHdvcmtpbmcgZGlyZWN0b3J5XG4gIGNvbnN0IGVudiA9IGxvYWRFbnYobW9kZSwgcHJvY2Vzcy5jd2QoKSwgJycpXG4gIGNvbnN0IGJhY2tlbmRVUkwgPSAnaHR0cDovL2xvY2FsaG9zdDo1MDAwJyAvLyBGaXhlZCBiYWNrZW5kIFVSTCB3aXRob3V0IC9hcGlcblxuICBjb25zb2xlLmxvZygnXHVEODNEXHVERDI3IFZpdGUgQ29uZmlndXJhdGlvbjonKVxuICBjb25zb2xlLmxvZygnICAgRnJvbnRlbmQgVVJMOiBodHRwOi8vbG9jYWxob3N0OjUxNzQnKVxuICBjb25zb2xlLmxvZygnICAgQmFja2VuZCBBUEkgVVJMOicsIGJhY2tlbmRVUkwpXG4gIGNvbnNvbGUubG9nKCcgICBQcm94eTogL2FwaSBcdTIxOTInLCBiYWNrZW5kVVJMKVxuICBcbiAgcmV0dXJuIHtcbiAgcGx1Z2luczogW1xuICAgIHZ1ZSgpLFxuICAgIHZ1ZXRpZnkoeyBhdXRvSW1wb3J0OiB0cnVlIH0pXG4gIF0sXG4gIHJlc29sdmU6IHtcbiAgICBhbGlhczoge1xuICAgICAgJ0AnOiBmaWxlVVJMVG9QYXRoKG5ldyBVUkwoJy4vc3JjJywgaW1wb3J0Lm1ldGEudXJsKSlcbiAgICAgIH1cbiAgICB9LFxuICAgIHNlcnZlcjoge1xuICAgICAgaG9zdDogJzAuMC4wLjAnLCAvLyBUaGlzIGFsbG93cyBhY2Nlc3MgZnJvbSBhbnkgSVAgYWRkcmVzc1xuICAgICAgcG9ydDogNTE3NCwgLy8gWW91IGNhbiBzcGVjaWZ5IGEgcG9ydCBpZiBuZWVkZWRcbiAgICAgIHByb3h5OiB7XG4gICAgICAgICcvYXBpJzoge1xuICAgICAgICAgIHRhcmdldDogYmFja2VuZFVSTCxcbiAgICAgICAgICBjaGFuZ2VPcmlnaW46IHRydWUsXG4gICAgICAgICAgc2VjdXJlOiBmYWxzZSxcbiAgICAgICAgICBjb25maWd1cmU6IChwcm94eSwgX29wdGlvbnMpID0+IHtcbiAgICAgICAgICAgIC8vIEFkdmFuY2VkIHByb3h5IGNvbmZpZ3VyYXRpb25cbiAgICAgICAgICAgIHByb3h5Lm9uKCdlcnJvcicsIChlcnIsIHJlcSwgcmVzKSA9PiB7XG4gICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1x1Mjc0QyBQcm94eSBFcnJvcjonLCBlcnIubWVzc2FnZSlcbiAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignICAgVGFyZ2V0IFVSTDonLCBiYWNrZW5kVVJMKVxuICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCcgICBSZXF1ZXN0IFVSTDonLCByZXEudXJsKVxuXG4gICAgICAgICAgICAgIC8vIEhhbmRsZSBFQ09OTlJFRlVTRUQgc3BlY2lmaWNhbGx5XG4gICAgICAgICAgICAgIGlmIChlcnIuY29kZSA9PT0gJ0VDT05OUkVGVVNFRCcpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCcgICBcdTI2QTBcdUZFMEYgIENvbm5lY3Rpb24gUmVmdXNlZCAtIEJhY2tlbmQgc2VydmVyIGlzIG5vdCBydW5uaW5nIScpXG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignICAgXHVEODNEXHVEQ0ExIE1ha2Ugc3VyZSB0aGUgYmFja2VuZCBpcyBydW5uaW5nIG9uOicsIGJhY2tlbmRVUkwpXG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignICAgXHVEODNEXHVEQ0ExIFN0YXJ0IGJhY2tlbmQgd2l0aDogY2QgY2h1cmNoLWJlICYmIG5wbSBydW4gZGV2JylcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgaWYgKCFyZXMuaGVhZGVyc1NlbnQpIHtcbiAgICAgICAgICAgICAgICByZXMud3JpdGVIZWFkKDUwMCwge1xuICAgICAgICAgICAgICAgICAgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJ1xuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgICAgICAgICBlcnJvcjogJ1Byb3h5IEVycm9yJyxcbiAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6IGVyci5jb2RlID09PSAnRUNPTk5SRUZVU0VEJ1xuICAgICAgICAgICAgICAgICAgICA/ICdCYWNrZW5kIHNlcnZlciBpcyBub3QgcnVubmluZy4gUGxlYXNlIHN0YXJ0IHRoZSBiYWNrZW5kIHNlcnZlci4nXG4gICAgICAgICAgICAgICAgICAgIDogZXJyLm1lc3NhZ2UsXG4gICAgICAgICAgICAgICAgICB0YXJnZXQ6IGJhY2tlbmRVUkxcbiAgICAgICAgICAgICAgICB9KSlcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIHByb3h5Lm9uKCdwcm94eVJlcScsIChwcm94eVJlcSwgcmVxLCBfcmVzKSA9PiB7XG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdcdUQ4M0RcdURDRTQgU2VuZGluZyBSZXF1ZXN0IHRvOicsIHJlcS5tZXRob2QsIHJlcS51cmwsICdcdTIxOTInLCBiYWNrZW5kVVJMICsgcmVxLnVybClcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICBwcm94eS5vbigncHJveHlSZXMnLCAocHJveHlSZXMsIHJlcSwgX3JlcykgPT4ge1xuICAgICAgICAgICAgICBjb25zb2xlLmxvZygnXHVEODNEXHVEQ0U1IFJlY2VpdmVkIFJlc3BvbnNlOicsIHJlcS5tZXRob2QsIHJlcS51cmwsICdTdGF0dXM6JywgcHJveHlSZXMuc3RhdHVzQ29kZSlcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG59KVxuXG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQWtWLFNBQVMsZUFBZSxXQUFXO0FBQ3JYLFNBQVMsb0JBQW9CO0FBQzdCLE9BQU8sU0FBUztBQUNoQixPQUFPLGFBQWE7QUFDcEIsU0FBUyxlQUFlO0FBSjZMLElBQU0sMkNBQTJDO0FBT3RRLElBQU8sc0JBQVEsYUFBYSxDQUFDLEVBQUUsS0FBSyxNQUFNO0FBRXhDLFFBQU0sTUFBTSxRQUFRLE1BQU0sUUFBUSxJQUFJLEdBQUcsRUFBRTtBQUMzQyxRQUFNLGFBQWE7QUFFbkIsVUFBUSxJQUFJLCtCQUF3QjtBQUNwQyxVQUFRLElBQUksd0NBQXdDO0FBQ3BELFVBQVEsSUFBSSx1QkFBdUIsVUFBVTtBQUM3QyxVQUFRLElBQUkseUJBQW9CLFVBQVU7QUFFMUMsU0FBTztBQUFBLElBQ1AsU0FBUztBQUFBLE1BQ1AsSUFBSTtBQUFBLE1BQ0osUUFBUSxFQUFFLFlBQVksS0FBSyxDQUFDO0FBQUEsSUFDOUI7QUFBQSxJQUNBLFNBQVM7QUFBQSxNQUNQLE9BQU87QUFBQSxRQUNMLEtBQUssY0FBYyxJQUFJLElBQUksU0FBUyx3Q0FBZSxDQUFDO0FBQUEsTUFDcEQ7QUFBQSxJQUNGO0FBQUEsSUFDQSxRQUFRO0FBQUEsTUFDTixNQUFNO0FBQUE7QUFBQSxNQUNOLE1BQU07QUFBQTtBQUFBLE1BQ04sT0FBTztBQUFBLFFBQ0wsUUFBUTtBQUFBLFVBQ04sUUFBUTtBQUFBLFVBQ1IsY0FBYztBQUFBLFVBQ2QsUUFBUTtBQUFBLFVBQ1IsV0FBVyxDQUFDLE9BQU8sYUFBYTtBQUU5QixrQkFBTSxHQUFHLFNBQVMsQ0FBQyxLQUFLLEtBQUssUUFBUTtBQUNuQyxzQkFBUSxNQUFNLHVCQUFrQixJQUFJLE9BQU87QUFDM0Msc0JBQVEsTUFBTSxrQkFBa0IsVUFBVTtBQUMxQyxzQkFBUSxNQUFNLG1CQUFtQixJQUFJLEdBQUc7QUFHeEMsa0JBQUksSUFBSSxTQUFTLGdCQUFnQjtBQUMvQix3QkFBUSxNQUFNLHNFQUE0RDtBQUMxRSx3QkFBUSxNQUFNLHFEQUE4QyxVQUFVO0FBQ3RFLHdCQUFRLE1BQU0sOERBQXVEO0FBQUEsY0FDdkU7QUFFQSxrQkFBSSxDQUFDLElBQUksYUFBYTtBQUNwQixvQkFBSSxVQUFVLEtBQUs7QUFBQSxrQkFDakIsZ0JBQWdCO0FBQUEsZ0JBQ2xCLENBQUM7QUFDRCxvQkFBSSxJQUFJLEtBQUssVUFBVTtBQUFBLGtCQUNyQixPQUFPO0FBQUEsa0JBQ1AsU0FBUyxJQUFJLFNBQVMsaUJBQ2xCLG9FQUNBLElBQUk7QUFBQSxrQkFDUixRQUFRO0FBQUEsZ0JBQ1YsQ0FBQyxDQUFDO0FBQUEsY0FDSjtBQUFBLFlBQ0YsQ0FBQztBQUNELGtCQUFNLEdBQUcsWUFBWSxDQUFDLFVBQVUsS0FBSyxTQUFTO0FBQzVDLHNCQUFRLElBQUksaUNBQTBCLElBQUksUUFBUSxJQUFJLEtBQUssVUFBSyxhQUFhLElBQUksR0FBRztBQUFBLFlBQ3RGLENBQUM7QUFDRCxrQkFBTSxHQUFHLFlBQVksQ0FBQyxVQUFVLEtBQUssU0FBUztBQUM1QyxzQkFBUSxJQUFJLGdDQUF5QixJQUFJLFFBQVEsSUFBSSxLQUFLLFdBQVcsU0FBUyxVQUFVO0FBQUEsWUFDMUYsQ0FBQztBQUFBLFVBQ0g7QUFBQSxRQUNGO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
