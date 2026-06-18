import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import "./Policy.css";

const POLICY_DATA = {
  "/return-policy": {
    title: "Return & Exchange Policy",
    update: "Last Updated: 01/2026",
    content: [
      {
        p: ["We always commit to providing the best shopping experience for our customers. The return and exchange policy at AeroPace is designed to ensure the rights and interests of our customers in case products do not meet expectations or encounter quality issues."]
      },
      { 
        h3: "1. Return & Exchange Conditions", 
        p: ["Products must be in their original condition with all tags and labels attached, and not have been used within 7 days of receipt.",
          "Returns must be initiated within 7 days of receipt.",
          "Products must be in their original packaging with all accompanying documentation, accessories, and labels (if applicable).",
          "The return and exchange policy applies to products purchased directly from the AeroPace website."
        ] 
      },
      {
        h3: "2. Return & Exchange Process",
        p: [
          "Step 1 - Contact Support:"," Call our hotline: 012345678 or send an email to cskh@aeropace.vn. Provide information about the product you want to return including: order code, images of the product's condition, and reason for return.",
          "Step 2 - Confirmation and Instructions:"," The customer service team will confirm your request within 1-2 business days. Specific instructions for returning the product to our warehouse will be provided via email or hotline.",
          "Step 3 - Return Product:"," Pack the product you wish to return carefully, along with the purchase invoice. Send it to AeroPace's warehouse address as per the instructions received.",
          "Step 4 - Process Request:"," Once we receive and inspect the product, we will notify you of the return result via email or message. The processing time for returns is 3-5 business days from the date we receive the product."
        ] 
      },
      { 
        h3: "3. Shipping Costs", 
        p: ["Free return and exchange if the defect is from the manufacturer. For other cases, customers are required to pay the shipping fee."] 
      }
    ]
  },
  "/warranty-policy": {
    title: "Warranty Policy",
    update: "Last Updated: 01/2026",
    content: [
      {
        p: ["The warranty policy at AeroPace is designed to ensure the rights and interests of our customers when using our products. We are committed to supporting our customers throughout the entire product usage process."]
      },
      {
        h3: "1. General Terms of Warranty",
        p: [
          "All products purchased at AeroPace are covered by the manufacturer's warranty or our own policy (if applicable).",
          "The warranty period and specific conditions will be clearly stated in the product description or warranty card included.",
          "This policy only applies to the main product, not including any free gifts or accessories outside the warranty scope."
        ]
      },
      {
        h3: "2. Conditions for Free Warranty Service",
        p: [
          "Technical defects from the manufacturer (not due to user error).",
          "Products are still within the warranty period as defined at the time of purchase.",
          "Products have complete invoices, warranty cards, or purchase confirmation information at AeroPace.",
          "Warranty labels, product codes, or serial numbers are intact and not torn or erased."
        ]
      },
      {
        h3: "3. Cases Not Covered by Warranty",
        p: [
          "Products that have exceeded their warranty period.",
          "Damage caused by improper use, failure to follow the manufacturer's usage instructions.",
          "Products that have been tampered with or repaired by unauthorized third parties.",
          "Products damaged by natural disasters, fires, floods, severe impacts, or incorrect power usage.",
          "Natural wear and tear components (batteries, cables, cushions, tires, etc.)."
        ]
      },
      {
        h3: "4. Warranty Process",
        p: [
          "Step 1 - Contact Warranty Request:"," Call hotline 012345678 or send an email to cskh@aeropace.vn. Provide the order number, images/clip describing the issue, and the purchase invoice.",
          "Step 2 - Confirm Warranty Request:"," The customer service department will verify and respond to the request within 1-2 business days.",
          "Step 3 - Submit Warranty Product:"," If eligible, customers should carefully package the product and send it to the warranty address as instructed.",
          "Step 4 - Process Warranty:"," Processing time ranges from 7-14 business days depending on the severity of the product defect.",
          "Step 5 - Return Product:"," Once the repair is completed, the product will be sent back to the customer."
        ]
      },
      {
        h3: "5. Support for Out-of-Warranty Products",
        p: ["If the product is out of warranty, we offer repair services at a discounted rate. Customers will be notified of the costs before any work is performed."]
      }
    ]
  },
  "/privacy-policy": {
    title: "Privacy Policy",
    update: "Last Updated: 01/2026",
    content: [
      {
        p: ["AeroPace is committed to protecting the privacy and personal information of our customers. This policy explains how we collect, use, and protect your data when shopping at our system."]
      },
      {
        h3: "1. Collection of Personal Information",
        p: [
          "Identifying Information: Name, phone number, email, and shipping address.",
          "Payment Information: Transaction details and card information (encrypted by the payment provider).",
          "Access Data: IP address, device type, browser, and purchase history to improve user experience."
        ]
      },
      {
        h3: "2. Purpose of Information Usage",
        p: [
          "Processing orders, delivery, and providing post-purchase services (warranty, returns).",
          "Supporting customer service and handling complaints.",
          "Sending updates about new products and promotional campaigns (with customer consent)."
        ]
      },
      {
        h3: "3. Sharing of Information",
        p: [
          "We only share necessary information with shipping companies (GHTK, Viettel Post...) and payment partners to complete orders.",
          "Providing information as required by authorized legal authorities in accordance with Vietnamese regulations.",
          "Absolutely no sale or exchange of customer information with third parties for commercial purposes."
        ]
      },
      {
        h3: "4. Customer Rights",
        p: [
          "Access, edit, or request deletion of personal information at any time through the online account or by contacting the hotline.",
          "Refuse to receive advertising or marketing information by clicking 'Unsubscribe' in the email or message."
        ]
      },
      {
        h3: "5. Data Retention and Security",
        p: [
          "Account information is stored for life until the customer requests its deletion.",
          "Transaction data is retained for a minimum of 3 years for audit and legal purposes.",
          "All data transmission is encrypted according to SSL standards and access control is strictly enforced."
        ]
      },
      {
        h3: "6. Complaint Resolution Process",
        p: [
          "Step 1 - Receipt:"," Customers submit feedback via hotline 012345678 or email cskh@aeropace.vn.",
          "Step 2 - Verification:"," We will confirm receipt of the complaint within 48 business hours.",
          "Step 3 - Processing: ","The technical and legal teams will investigate and provide a resolution within 7 business days.",
          "Step 4 - Response:"," The resolution results will be officially communicated to the customer via email."
        ]
      }
    ]
  }
};

function Policy() {
  const { pathname } = useLocation();
  const data = POLICY_DATA[pathname];

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  if (!data) {
    return <div className="policy-container"><h1 style={{color: 'white'}}>Trang không tồn tại</h1></div>;
  }

  const renderParagraph = (paragraph, index) => {
    const match = paragraph.match(/^(Bước \d+ - [^:]+:)(.*)$/);
    if (match) {
      return (
        <p key={index}>
          <strong>{match[1]}</strong>{match[2]}
        </p>
      );
    }
    return <p key={index}>{paragraph}</p>;
  };

  return (
    <div className="policy-wrapper">
      <div className="policy-container">
        <h1 className="policy-title">{data.title}</h1>
        <p className="policy-date">{data.update}</p>
        
        <div className="policy-content">
          {data.content.map((section, index) => (
            <div key={index} className="policy-section">
              {section.h3 && <h3>{section.h3}</h3>}
              {section.p.map((paragraph, i) => renderParagraph(paragraph, i))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Policy;