## Grocery-Receipt-App

### Progress Paths
#### **Version 1a-1g** - Get the App working with the most basic, but necessary features implemented
* Version 1a: Strictly a button that directs the user to upload a photo which will connect to the Amazon textract API, show the results of what the API sees in a format we can query
* Version 1b: Upload button with a preview above it of the receipt uploaded, then a separate page with the receipt contents on another page in a tabular format
* Version 1c: Same upload page, but now hardcode 2 users who can split the receipt on the 
results page of the receipt with buttons to select who bought what
* Version 1d: Same upload page, now add a total feature for the 2 hardcoded users
* Version 1e: Same upload page, now add another col for sharing the cost between users
* Version 1f: Same upload page, now make it so you can dynamically change the number of users (no DB connection)
* Version 1g: Make the look of the app more refined? Or could put this step off and move onto other complex features (depends on time)

####  **Version 2a-2e - If more time allows, add thse features** - 
* Version 2a: Create a feature that sends a text to x amount of users with the given amount they owe on the app (still no db connection)
* Version 2b: Make it so that it sends not just the $ amount, but also the list of items they bought (Optional: Maybe also the receipt?/Date of Purchase)
* Version 2c: Account for tax on the receipt being split across users
* Version 2d: Connect the app to a DB to store User info, name, email, phone number so its easier to add repeat users to the receipt app.
* Version 2e: Make the UI look modern/professional. 

### Common Commands
* npm i - Installs all the dependencies listed in package.json
* npm install <package>@<version> - Installs a specific version of a package
* npm uninstall <package> - Removes a specific package from your project.
* npm update or npm update <package> - Updates all outdated local packages to their latest versions
* npm version <newversion> - Bumps the version in package.json 
* npm outdated - Shows a list of outdated packages
* npm list - Lists installed packages and their dependencies 
* npm audit - Scans for vulnerabilities

### How to Run the Project - Dev Instructions
* Make sure you are in the correct branch that you want to pull code from 
* Pull the code 
* Open the Folder Grocery-Receipt-App in your Visual Studio Code
* In the Helper Bar At the Top of VSC --> Click Terminal --> New Terminal
* cd Divvy
* To run the app in mobile/web, input into the terminal (Cd'd into Divvy) --> npx expo start
* In the terminal, run npm i
* Scan the QR code in the Expo app on Mobile