# **App Name**: Supermoda Raffles

## Core Features:

- Registration Form: Collect user data including full name, CPF, and purchase number.
- Coupon Code Generation: Automatically generate a unique coupon code (SM-00001, SM-00002, etc.) upon successful registration.
- Firestore Integration: Store registration details (name, CPF, purchase number, coupon number, timestamp) in Cloud Firestore.
- Duplicate Prevention: Prevent duplicate registrations using the same CPF and purchase number combination.
- Success Message: Display a confirmation message on the screen after successful registration, including the generated coupon number.
- Admin Panel: A password-protected (/admin) page displaying all registrations and coupon numbers in a table.

## Style Guidelines:

- Primary color: Supermoda Red (#E30613) to reflect the brand's identity.
- Background color: Light gray (#F5F5F5) to provide a clean and modern backdrop.
- Text color: Dark gray (#333333) for readability and contrast.
- Body and headline font: 'PT Sans', a humanist sans-serif providing a modern and readable experience.
- Use Tailwind CSS for a responsive and clean layout.
- Use Font Awesome icons, where appropriate, to highlight actions or information.