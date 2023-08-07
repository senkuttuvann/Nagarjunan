import { promises as fs } from "fs";
interface FinancialTransaction {
  guestName: string;
  transactionType: string;
  amount: number;
}

interface GuestBooking {
  guestName: string;
  checkInDate: Date;
  checkOutDate: Date;
  roomType: string;
  totalAmount: number;
}

// To read the guest bookings from the JSON file
async function readGuestBookings(): Promise<GuestBooking[]> {
  try {
    const bookingsJSON = await fs.readFile("./json/guestBookings.json", "utf8");
    return JSON.parse(bookingsJSON);
  } catch (error) {
    console.log(error);
    return [];
  }
}

// To read the financial transactions from the JSON file
async function readFinancialTransactions(): Promise<FinancialTransaction[]> {
  try {
    const financialTransactionsJSON = await fs.readFile(
      "./json/financialTransactions.json",
      "utf8"
    );
    return JSON.parse(financialTransactionsJSON);
  } catch (error) {
    return [];
  }
}

// To aggreagate financial charges for each guest

interface FinancialCharge {
  guestName: string;
  totalCharge: number;
}

async function generateFinancialCharges(): Promise<FinancialCharge[]> {
  try {
    const guestBookings = await readGuestBookings();
    const financialTransactions = await readFinancialTransactions();

    // Aggregating financial charges for each guest
    const chargesMap: Map<string, number> = new Map();

    guestBookings.forEach((booking) => {
      chargesMap.set(booking.guestName, 0);
    });

    financialTransactions.forEach((transaction) => {
      const charge = chargesMap.get(transaction.guestName);
      if (charge !== undefined) {
        chargesMap.set(transaction.guestName, charge + transaction.amount);
      }
    });

    // Converting Map to an array of FinancialCharge objects
    const financialCharges: FinancialCharge[] = Array.from(
      chargesMap,
      ([guestName, totalCharge]) => ({
        guestName,
        totalCharge,
      })
    );

    return financialCharges;
  } catch (error) {
    return [];
  }
}

// To generate financial postings by grouping transactions by type and calculating total amount for each type
interface FinancialPosting {
  transactionType: string;
  totalAmount: number;
}

async function generateFinancialPostings(): Promise<FinancialPosting[]> {
  try {
    const financialTransactions = await readFinancialTransactions();

    // Grouping transactions by type and calculating total amount for each type
    const postingsMap: Map<string, number> = new Map();

    financialTransactions.forEach((transaction) => {
      const amount = postingsMap.get(transaction.transactionType) || 0;
      postingsMap.set(transaction.transactionType, amount + transaction.amount);
    });

    // Converting Map to an array of FinancialPosting objects
    const financialPostings: FinancialPosting[] = Array.from(
      postingsMap,
      ([transactionType, totalAmount]) => ({
        transactionType,
        totalAmount,
      })
    );

    return financialPostings;
  } catch (error) {
    return [];
  }
}

// To convert financial charges to XML
async function convertFinancialChargesToXML(): Promise<string> {
  const financialCharges = await generateFinancialCharges();
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<financialCharges>\n';

  financialCharges.forEach((charge) => {
    xml += `  <charge>\n    <guestName>${charge.guestName}</guestName>\n    <totalCharge>${charge.totalCharge}</totalCharge>\n  </charge>\n`;
  });

  xml += "</financialCharges>";

  return xml;
}

// To convert financial postings to XML
async function convertFinancialPostingsToXML(): Promise<string> {
  const financialPostings = await generateFinancialPostings();
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<financialPostings>\n';

  financialPostings.forEach((charge) => {
    xml += `  <charge>\n    <transactionType>${charge.transactionType}</transactionType>\n    <totalAmount>${charge.totalAmount}</totalAmount>\n  </charge>\n`;
  });

  xml += "</financialPostings>";

  return xml;
}

//write the XML data to separate files
convertFinancialChargesToXML().then((chargesXML) => {
  fs.writeFile("financialCharges.xml", chargesXML, "utf8");
});
convertFinancialPostingsToXML().then((postingsXML) => {
  fs.writeFile("financialPostings.xml", postingsXML, "utf8");
});
//write the JSON data to separate files
generateFinancialCharges().then((financialCharges) => {
  fs.writeFile(
    "financialCharges.json",
    JSON.stringify(financialCharges),
    "utf8"
  );
});

