# FYP
 
## Install packages before run:

Open a terminal and navigate to project directory

<code> cd donation_app <code>
../donation_app ><code> pip install -r requirements.txt <code>

Also, for frontend, open another terminal and navigate to the frontend directory

<code> cd donation_app <code>
<code> cd donations-frontend <code>
../donation_app/donations-frontend ><code> npm install <code>


## Sample accounts in the database:
Some accounts have been created beforehand for testing purposes

Staff accounts:

admin (superuser)
Username: admin
Password: abcd@1234

Moderator1
Username: moderator1
Password: abcd@1234

Moderator2
Username: moderator2
Password: abcd@1234

Volunteer1
Username: volunteer1
Password: abcd@1234

Volunteer2
Username: volunteer2
Password: abcd@1234

Normal User Accounts:

Donor1
Username: donor1
Password: abcd@1234

Donor2
Username: donor2
Password: abcd@1234

## Running the application
To run the backend tests, make sure you are in the project directory

<code> py manage.py test <code>

To start the Django backend server, make sure you are in the project directory
<code> py manage.py runserver <code>

To start the React development server, make sure you are in the frontend directory
<code> npm start <code>

Upon starting the application successfully, you will see this landing page
![Landing Page Screenshot](media/README/Landing_Page.png)