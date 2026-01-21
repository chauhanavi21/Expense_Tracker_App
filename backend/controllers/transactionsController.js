import { sql } from "../config/db.js";

export async function createTransaction(req, res) {
    try {
      const { title, amount, category, user_id } = req.body;
  
      if (!title || !user_id || !category || amount === undefined) {
        return res.status(400).json({ message: "All fields are required" });
      }
  
      const transaction = await sql`
        INSERT INTO transactions(user_id,title,amount,category)
        VALUES (${user_id},${title},${amount},${category})
        RETURNING *
      `;
  
      console.log(transaction);
      res.status(201).json(transaction[0]);
    } catch (error) {
      console.log("Error creating the transaction", error);
      res.status(500).json({ message: "Internal server error" });
    }
}  

export async function getTransactionsByUserId(req, res) {
  try {
    const { userId } = req.params;

    const transactions = await sql`
        SELECT * FROM transactions WHERE user_id = ${userId} ORDER BY created_at DESC
      `;

    res.status(200).json(transactions);
  } catch (error) {
    console.log("Error getting the transactions", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function deleteTransaction(req, res) {
    try {
      const { id } = req.params;
  
      if (isNaN(parseInt(id))) {
        return res.status(400).json({ message: "Invalid transaction ID" });
      }
  
      const result = await sql`
        DELETE FROM transactions WHERE id = ${id} RETURNING *
      `;
  
      if (result.length === 0) {
        return res.status(404).json({ message: "Transaction not found" });
      }
  
      res.status(200).json({ message: "Transaction deleted successfully" });
    } catch (error) {
      console.log("Error deleting the transaction", error);
      res.status(500).json({ message: "Internal server error" });
    }
}