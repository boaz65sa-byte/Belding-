#!/bin/bash
# Run this on the Mac, inside the project folder.
set -e
cd "$(dirname "$0")/.."
npm install
npx cap sync ios
echo ""
echo "Next: npx cap open ios"
echo "In Xcode: select your Apple team, then Product > Archive > Distribute to App Store."
