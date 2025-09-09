---
title: "React Native M-Pesa Payments: STK Push Integration Guide with Daraja"
seoTitle: "React Native M-Pesa Payments: STK Push Integration Guide with Daraja."
seoDescription: "Learn how to integrate the M-Pesa STK Push API into your React Native app step by step. This guide covers setting up the Daraja API"
datePublished: Mon Aug 18 2025 20:59:37 GMT+0000 (Coordinated Universal Time)
cuid: cmehlltb5000w02kw9okzguar
slug: react-native-m-pesa-payments-stk-push-integration-guide-with-daraja
cover: https://cdn.hashnode.com/res/hashnode/image/stock/unsplash/z9CgKNW_Nq8/upload/89b1886cd8a99bfb3587c4593af72ac5.jpeg
tags: ngrok, javascript, ios, react-native, nodejs, android, typescript, expressjs-cilb5apda0066e053g7td7q24, expo, fintech, mpesa, tailwind-css, daraja-api, mpesa-integration-nodejs, paymentintegration

---

Mobile payments are the heartbeat of Kenya’s digital economy, and M-Pesa is the undisputed king. If you're building a mobile app with React Native or Expo, integrating Safaricom’s Daraja API for Lipa na M-Pesa Online can unlock seamless payments for your users.  
In this guide, we’ll walk through how to set up a simple Express backend to handle the Daraja API and a React Native frontend to trigger STK Push payments.

## What is STK Push?

STK Push leverages the SIM Application Toolkit to send a prompt directly to a customer’s phone, asking them to enter their M-Pesa PIN to complete a payment. It eliminates the need for customers to remember paybill numbers, account numbers, or transaction codes, significantly reducing friction in the payment process.

## **What You’ll Need:**

* A Safaricom Daraja API account: [Sign up here](https://developer.safaricom.co.ke/)
    
* Node.js and Express installed
    
* React Native development environment ([Expo](https://expo.dev/) [)](https://developer.safaricom.co.ke/)
    
* Ngrok (for exposing your local backend to Safaricom’s Callback).
    

## Step 1: Set Up the Express Backend

Create a new folder and initialize your Node project:

```bash
mkdir backend
cd backend
npm init -y
npm install express axios  dotenv
```

Here’s what each module does:

* **express** → A popular Node.js framework for building web servers and APIs. We use it to create endpoints like `/stkpush` (to initiate payments) and `/callback` (to handle responses from Safaricom).
    
* **axios** → A promise-based HTTP client. It makes it easy to send requests to the M-Pesa Daraja API (e.g., requesting an access token or triggering an STK push).
    
* **dotenv** → A module that loads environment variables from a `.env` file into `process.env`. This allows us to securely store sensitive credentials like the **Consumer Key**, **Consumer Secret**, **Shortcode**, and **Passkey** outside our codebase.
    

Create a `.env` file for your credentials

```bash
MPESA_CONSUMER_KEY=your-consumer-key
MPESA_CONSUMER_SECRET=your-consumer-secret
MPESA_SHORTCODE=174379
MPESA_PASSKEY=your-passkey
CALLBACK_URL= https://your-ngrok-url/callback
```

To integrate with the M-Pesa Daraja API, you first need to obtain your credentials from the [**Safaricom Daraja Developer Portal**](https://developer.safaricom.co.ke/). Start by logging in and navigating to the **My Apps** tab, where you can create a new app. While creating the app, select **Lipa na M-Pesa Sandbox** and **M-Pesa Sandbox** as the API products. Once the app is created, you will be provided with a **Consumer Key** and **Consumer Secret**, which you should copy and save securely in your `.env` file.

The **Consumer Key** and **Consumer Secret** are used for **authentication** with the M-Pesa Daraja API.

Next, go to the **APIs** tab, and under **M-Pesa Express** , you will find a **Shortcode** and **Passkey** for sandbox testing.

![](https://cdn.hashnode.com/res/hashnode/image/upload/v1755546887765/b6767e76-f495-4d50-b010-a9700fd3c0cc.jpeg align="center")

On the **Simulator** page (as shown in the screenshot below), you’ll see the **Shortcode** (listed as *Party B*) together with the **Passkey**. Make sure to copy both values and save them securely in your `.env` file.

These credentials are meant for the sandbox environment to allow you to test payments. When moving your application to production, Safaricom will provide you with a new set of credentials for the live environment once your application is approved.

![](https://cdn.hashnode.com/res/hashnode/image/upload/v1755546970038/d9bd7a60-5d81-43ec-b361-89a5bcb2697b.jpeg align="center")

Create server.js

```javascript
// server.js
import express from "express";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();
const app = express();
app.use(express.json());

const getAccessToken = async () => {
  try {
    const url =
      "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials";
    const auth = Buffer.from(
      `${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`
    ).toString("base64");

    const response = await axios.get(url, {
      headers: {
        Authorization: `Basic ${auth}`,
      },
    });
    return response.data.access_token;
  } catch (error) {
    console.error("Error getting access token:", error);
    throw error;
  }
};

const getPassword = (timestamp) => {
  const shortCode = process.env.MPESA_SHORTCODE;
  const passKey = process.env.MPESA_PASSKEY;
  const password = `${shortCode}${passKey}${timestamp}`;
  return Buffer.from(password).toString("base64");
};

const getTimestamp = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");

  return `${year}${month}${day}${hours}${minutes}${seconds}`;
};
// @api triggers stk push via lipa-na-mpesa-online
// default shortcode for development/sandbox environment is 174379
app.post("/stkpush", async (req, res) => {
  try {
    const { phoneNumber, amount } = req.body;
    const token = await getAccessToken();

    // Format phone number (remove leading 0 or +254)
    let formattedPhone = phoneNumber;
    if (phoneNumber.startsWith("0")) {
      formattedPhone = `254${phoneNumber.slice(1)}`;
    } else if (phoneNumber.startsWith("+254")) {
      formattedPhone = phoneNumber.slice(1);
    }

    // Prepare STK Push request
    const timestamp = getTimestamp();
    const password = getPassword(timestamp);
    const shortCode = process.env.MPESA_SHORTCODE;

    const url =
      "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest";

    const data = {
      BusinessShortCode: shortCode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: amount,
      PartyA: formattedPhone,
      PartyB: shortCode,
      PhoneNumber: formattedPhone,
      CallBackURL: process.env.CALLBACK_URL,
      AccountReference: "Test Payment",
      TransactionDesc: "Test Payment",
    };

    // Make STK Push request
    const stkRes = await axios.post(url, data, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    res.json(stkRes.data);
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: "Payment initiation failed" });
  }
});

// this callback is called upon successful transaction
app.post("/callback", (req, res) => {
  console.log("STK Callback response:", JSON.stringify(req.body));

  // Extract info from callback
  const callbackData = req.body.Body.stkCallback;

  // Always respond to Safaricom with a success to acknowledge receipt
  res.json({ ResultCode: 0, ResultDesc: "Accepted" });

  // Process the callback data as needed for your application
  if (callbackData.ResultCode === 0) {
    // Payment successful
    const transactionDetails = callbackData.CallbackMetadata.Item;
    // Process the successful payment
    console.log("Payment successful");

    // In production application, you would:
    // 1. Update your database
    // 2. Fulfill the order
    // 3. Notify the customer
    // etc.
  } else {
    // Payment failed
    console.log("Payment failed:", callbackData.ResultDesc);
  }
});

app.listen(3000, () => console.log("Server running on port 3000"));
```

This code sets up an **Express.js server** that integrates with **Safaricom’s M-Pesa Daraja API** to handle **STK Push (Lipa Na M-Pesa Online)** payments.

* It authenticates with M-Pesa by generating an **OAuth access token** using the consumer key and secret.
    
* It builds a **secure password** using the business shortcode, passkey, and a timestamp (required by Daraja).
    
* The `/stkpush` endpoint allows clients to initiate a payment by sending a **phone number and amount**, which triggers the STK push request to the customer’s phone.
    
* Phone numbers are formatted into the required `2547XXXXXXXX` format before sending the request.
    
* M-Pesa then sends the transaction results (success or failure) to the `/callback` endpoint.
    
* The server acknowledges the callback and can process successful payments (e.g., update a database, confirm an order, or notify the user).
    

To start the **Express backend**, run:

```bash
node server.js
```

Use [**Ngrok**](https://ngrok.com/) to expose your local server:

```bash
ngrok http 3000
```

Using ngrok ensures your local development environment behaves just like a live server, making it easier to test and debug the full payment flow before deploying to production.

Update environment variable `CALLBACK_URL` your `.env` file with the Ngrok URL.

Your `.env` file should be similar to this:

```bash
MPESA_CONSUMER_KEY=your-consumer-key
MPESA_CONSUMER_SECRET=your-consumer-secret
MPESA_SHORTCODE=174379
MPESA_PASSKEY=your-passkey
CALLBACK_URL= https://your-ngrok-url/callback
```

## Step 2: React Native Frontend

Create a new React Native project:

```bash
npx create-expo-app@latest
cd frontend
npm install axios
```

In app/(tabs)/index.js:

This **React Native screen** creates the mobile user interface for initiating an **M-Pesa STK Push payment**.

* It uses **React hooks** (`useState`) to manage input values for the **phone number**, **amount**, and a **loading state** when submitting the payment.
    
* The form has two input fields:
    
    * **Phone number** (formatted as `2547XXXXXXXX`).
        
    * **Amount** to pay.
        
* When the user taps **“Pay Now”**, the `initiatePayment` function runs:
    
    1. It checks that both fields are filled in.
        
    2. It makes a `POST` request to the backend `/stkpush` endpoint (exposed through an ngrok URL).
        
    3. If successful, it alerts the user to check their phone for the M-Pesa popup.
        
    4. If there’s an error, it shows a failure alert.
        
* While the request is processing, the button is disabled and shows a **loading spinner** (`ActivityIndicator`) instead of text.
    
* The screen design uses some custom UI components (`ParallaxScrollView`, `ThemedText`, `ThemedView`) for styling, plus a nice animated **React logo header**.
    

```javascript
// app/(tabs)/index.js
import { Image } from "expo-image";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { HelloWave } from "@/components/HelloWave";
import ParallaxScrollView from "@/components/ParallaxScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useState } from "react";

export default function HomeScreen() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  const initiatePayment = async () => {
    // Validate inputs first
    if (!phoneNumber || !amount) {
      Alert.alert("Missing Info", "Please enter both phone number and amount.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        "https://your-ngrok-url/stkpush",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            phoneNumber: phoneNumber.replace("+", ""),
            amount,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      Alert.alert("Success", "STK Push initiated. Check your phone.");
      console.log(data);
    } catch (error) {
      Alert.alert("Error", "Failed to initiate payment.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: "#A1CEDC", dark: "#1D3D47" }}
      headerImage={
        <Image
          source={require("@/assets/images/partial-react-logo.png")}
          style={styles.reactLogo}
        />
      }
    >
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Welcome!</ThemedText>
        <HelloWave />
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <View style={styles.container}>
          <Text style={styles.title}>Lipa na M-Pesa Online</Text>
          <TextInput
            style={styles.input}
            placeholder="Phone Number (e.g., 2547XXXXXXXX)"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="phone-pad"
          />
          <TextInput
            style={styles.input}
            placeholder="Amount"
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
          />

          <TouchableOpacity
            style={[styles.btn, loading && { opacity: 0.6 }]}
            onPress={initiatePayment}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>Pay Now</Text>
            )}
          </TouchableOpacity>
        </View>
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: "absolute",
  },
  container: { flex: 1, padding: 20, justifyContent: "center" },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
  },
  btn: {
    backgroundColor: "#0A84FF",
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: "center",
    width: "100%",
    marginTop: 10,
  },
  btnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
```

To run the mobile app, we use **Expo CLI**. After installing it globally with `npm install -g expo-cli`, start the project by running `npx expo start`. This opens the Expo Developer Tools and shows a QR code you can scan using the [**Expo Go**](https://expo.dev/go) app on your phone, or you can launch the app directly on an Android emulator (`a`) or iOS simulator (`i`). Expo takes care of bundling and live reloading, so you can instantly see changes as you develop.

Remember to replace your Ngrok endpoint for the fetch operation to work appropriately.

## Step 3: Test the Integration

* Launch your backend and frontend.
    
* Use a valid Safaricom number in sandbox format (e.g., `2547XXXXXXXX`).
    
* Watch your phone for the STK Push prompt.
    
* Check your backend logs for the callback.
    

![](https://cdn.hashnode.com/res/hashnode/image/upload/v1755545880941/a733581e-f474-456a-85e4-6bea4967e675.jpeg align="center")

### ✅ Conclusion

You’ve just built a working M-Pesa payment flow using Daraja API, Express, and React Native. This setup is perfect for e-commerce, service apps, or any platform that needs mobile payments in Kenya.