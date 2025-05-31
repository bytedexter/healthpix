# Deployment Guide for HealthPix Platform

## Development Mode

The application is fully functional in development mode and can be started with:

```bash
npm run dev
```

This will start the Next.js development server with Turbopack.

If you encounter issues with Turbopack, you can use the standard webpack bundler:

```bash
npm run dev:standard
```

## Production Build

### Resolving Permission Issues

If you encounter a permission error like:
```
[Error: EPERM: operation not permitted, open/unlink '.next/trace']
```

You can try one of these approaches:

1. **Run PowerShell as Administrator** and execute:
   ```powershell
   cd 'd:\CODES\Medical\healthpix_platform - Copy\main-website'
   Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
   npm run build:standard
   ```

2. **Restart your computer** to release any file locks, then try again.

3. **Use the standard build** without Turbopack:
   ```bash
   npm run build:standard
   ```

4. **Run the cleanup script**:
   ```powershell
   .\cleanup.ps1
   ```
   
### Building for Production

Once you've resolved permission issues, build the application with:

```bash
npm run build
```

Or for the standard webpack build:

```bash
npm run build:standard
```

### Starting the Production Server

Start the production server with:

```bash
npm start
```

## Deployment to Hosting Platforms

### AWS Amplify

The application is already configured for deployment on AWS Amplify. When pushing changes:

1. Make sure you're using the standard build process:
   ```bash
   # The default build command in package.json should be:
   "build": "next build"  # NOT "next build --turbopack"
   ```

2. If updating the build configuration, update your Amplify settings in the AWS console:
   - Build command: `npm run build`
   - Output directory: `.next`

3. Amplify automatically detects changes in your repository and deploys them.

4. To troubleshoot Amplify builds:
   - Check the build logs in the AWS Amplify console
   - Ensure your Node.js version in Amplify matches your local environment
   - Verify environment variables are correctly set in the Amplify console

> **Important**: Turbopack (Next.js' experimental bundler) might not be fully compatible with AWS Amplify. If you encounter build issues, ensure you're using the standard build process without the `--turbopack` flag.

### Firebase Hosting

1. Install Firebase tools:
   ```bash
   npm install -g firebase-tools
   ```

2. Login to Firebase:
   ```bash
   firebase login
   ```

3. Initialize Firebase:
   ```bash
   firebase init hosting
   ```
   
4. Deploy to Firebase:
   ```bash
   firebase deploy --only hosting
   ```

### Vercel

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Deploy to Vercel:
   ```bash
   vercel
   ```

### Netlify

1. Install Netlify CLI:
   ```bash
   npm install -g netlify-cli
   ```

2. Deploy to Netlify:
   ```bash
   netlify deploy
   ```

## Troubleshooting

### API Connection Issues

If you encounter API connection issues:

1. Check your Firebase configuration in `src/lib/firebase.ts`
2. Verify that your Firebase Realtime Database is set up correctly
3. Check CORS settings if accessing from a different domain
4. Use the fallback data option by setting `USE_FALLBACK_DATA = true` in `src/lib/api.ts`

### Build Errors

If you encounter other build errors:

1. Clear Node.js cache:
   ```bash
   npm cache clean --force
   ```

2. Update dependencies:
   ```bash
   npm update
   ```

3. Delete node_modules and reinstall:
   ```bash
   rm -rf node_modules
   npm install
   ```

Follow these steps:

1. **Close all instances of VS Code, Node.js, and other applications** that might be using files in the project directory.

2. **Run PowerShell as Administrator**
   - Right-click on PowerShell and select "Run as Administrator"
   - Navigate to the project directory:
     ```powershell
     cd "d:\CODES\Medical\healthpix_platform - Copy\main-website"
     ```

3. **Delete the .next directory**
   ```powershell
   Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
   ```

4. **Build the application**
   ```powershell
   npm run build
   ```

5. **Start the production server**
   ```powershell
   npm start
   ```

### Alternative Solution

If the permission issue persists:

1. Use the development server for local testing:
   ```bash
   npm run dev
   ```

2. For production deployment, consider:
   - Using a CI/CD pipeline (GitHub Actions, Vercel, Netlify)
   - Deploying from a different environment (WSL, Docker, or another machine)

## Firebase Configuration

The application is configured to use Firebase:
- Project ID: healthpix-3c036
- Database URL: https://healthpix-3c036-default-rtdb.firebaseio.com

Ensure that Firebase authentication and Realtime Database are properly set up in the Firebase console.

## API Error Handling

The application includes built-in fallback data to ensure that it continues to function even when the API endpoints return errors. This makes the app resilient against backend issues.

If you need to modify the fallback data, edit the `getFallbackMedicines()` and `getFallbackOrders()` functions in `src/lib/api.ts`.
