// Initialize the map
const map = L.map('map').setView([39.500827297652705, -84.73914516553843], 19);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
}).addTo(map);

let markers = [];

// Update message box with feedback
function updateMessageBox(message) {
    const messageBox = document.getElementById('messageBox');
    messageBox.textContent = message;
}

// Location mappings for buildings
function getCoordinates(buildingName) {
    const locationMapping = {
        "Building A": [39.5009, -84.7400],
        "Building B": [39.5010, -84.7410],
        "Building C": [39.5012, -84.7420]
    };
    return locationMapping[buildingName] || [39.5000, -84.7400];
}

// CAS Login Handler
async function initiateCASLogin() {
    const serviceURL = 'https://yourapp.com/login/callback'; // Replace with your app's URL
    const casLoginURL = `https://auth.miamioh.edu/cas/login?service=${encodeURIComponent(serviceURL)}`;
    window.location.href = casLoginURL;  // Redirects the user to CAS
}

// CAS Callback Handler
async function handleCASCallback() {
    const urlParams = new URLSearchParams(window.location.search);
    const ticket = urlParams.get('ticket');

    if (ticket) {
        const serviceURL = 'https://yourapp.com/login/callback'; // Same URL used in initiateCASLogin
        const validateURL = `https://auth.miamioh.edu/cas/serviceValidate?ticket=${ticket}&service=${encodeURIComponent(serviceURL)}`;

        try {
            const response = await fetch(validateURL);
            const responseText = await response.text();

            if (responseText.includes('<cas:authenticationSuccess>')) {
                const usernameMatch = responseText.match(/<cas:user>(.*)<\/cas:user>/);
                const username = usernameMatch ? usernameMatch[1] : null;

                if (username) {
                    localStorage.setItem('cas_user', username); // Store the CAS username locally
                    fetchActiveCourses(); // Now you can fetch courses for the authenticated user
                    updateMessageBox(`Welcome, ${username}. Courses fetched successfully.`);
                } else {
                    updateMessageBox('CAS authentication successful, but could not retrieve username.');
                }
            } else {
                updateMessageBox('CAS authentication failed.');
            }
        } catch (error) {
            updateMessageBox('Error validating CAS ticket.');
            console.error('Error validating CAS ticket:', error);
        }
    }
}

// Fetch active courses from your server
async function fetchActiveCourses() {
    try {
        const response = await fetch('https://yourapp.com/api/courses?active=true'); // Use your server’s API
        if (response.ok) {
            const courses = await response.json();
            if (courses.length > 0) {
                displayCourseButtons(courses);
                updateMessageBox('Currently active courses fetched successfully.');
            } else {
                updateMessageBox('No active courses at the moment.');
            }
        } else {
            updateMessageBox(`Error: ${response.status} - ${response.statusText}`);
        }
    } catch (error) {
        updateMessageBox('Failed to fetch active courses.');
        console.error('Error fetching active courses:', error);
    }
}

// Display course buttons and plot course locations on the map
function displayCourseButtons(courses) {
    const courseList = document.getElementById('courseList');
    courseList.innerHTML = ''; // Clear previous buttons

    courses.forEach(course => {
        const courseButton = document.createElement('button');
        courseButton.textContent = course.name;
        courseButton.addEventListener('click', () => {
            const courseLocation = course.sis_location || "Building A"; // Assuming 'sis_location' exists
            const [lat, lng] = getCoordinates(courseLocation);
            map.setView([lat, lng], 19);
            updateMessageBox(`Centered on ${course.name}`);
        });
        courseList.appendChild(courseButton);
    });

    courseList.style.display = 'block';
}

// Check if there is a CAS ticket and handle it
window.onload = () => {
    if (window.location.pathname === '/login/callback') {
        handleCASCallback();
    }
};

// Hamburger menu toggle
const hamMenu = document.querySelector('.hamburger-menu');
const hamburgerContent = document.querySelector('.hamburger-content');

hamMenu.addEventListener('click', () => {
    hamMenu.classList.toggle('active');
    hamburgerContent.style.display = hamburgerContent.style.display === 'flex' ? 'none' : 'flex';
});

// Event listener for the "Get Courses" button to initiate CAS login
document.getElementById('getCoursesBtn').addEventListener('click', initiateCASLogin);

// "Back" button functionality
document.getElementById('backBtn').addEventListener('click', () => {
    const courseList = document.getElementById('courseList');
    courseList.style.display = 'none';
    updateMessageBox('Use the buttons to interact with the map.');
});
