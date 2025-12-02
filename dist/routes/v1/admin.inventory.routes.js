import { Router } from "express";
import { z } from "zod";
import mongoose from "mongoose";
import requireAdmin from "../../middlewares/auth.js";
import { dbConnect } from "../../db/connection.js";
import { InventoryService } from "../../services/inventory.service.js";
const router = Router();
const AddStockDTO = z.object({
    quantity: z.number().int().positive(),
    type: z.enum(["PURCHASE", "RETURN", "ADJUSTMENT"]).default("PURCHASE"),
    reason: z.string().optional(),
    reference: z.string().optional() // PO number, supplier invoice, etc.
});
const RemoveStockDTO = z.object({
    quantity: z.number().int().positive(),
    type: z.enum(["DAMAGE", "ADJUSTMENT"]).default("DAMAGE"),
    reason: z.string().min(1, "Reason required for stock removal"),
    reference: z.string().optional()
});
const IdParam = z.object({
    id: z.string().refine(mongoose.Types.ObjectId.isValid, "Invalid ObjectId")
});
// Add stock to product
router.post("/products/:id/stock/add", requireAdmin, async (req, res, next) => {
    try {
        await dbConnect();
        const { id } = IdParam.parse(req.params);
        const body = AddStockDTO.parse(req.body);
        await InventoryService.addStock(id, body.quantity, body.type, req.user._id, body.reason, body.reference);
        const currentStock = await InventoryService.getCurrentStock(id);
        res.json({
            ok: true,
            data: {
                message: `Added ${body.quantity} units to stock`,
                currentStock
            }
        });
    }
    catch (error) {
        if (error.message === "Product not found") {
            return res.status(404).json({ ok: false, code: "PRODUCT_NOT_FOUND" });
        }
        next(error);
    }
});
// Remove stock from product
router.post("/products/:id/stock/remove", requireAdmin, async (req, res, next) => {
    try {
        await dbConnect();
        const { id } = IdParam.parse(req.params);
        const body = RemoveStockDTO.parse(req.body);
        await InventoryService.removeStock(id, body.quantity, body.type, req.user._id, body.reason, body.reference);
        const currentStock = await InventoryService.getCurrentStock(id);
        res.json({
            ok: true,
            data: {
                message: `Removed ${body.quantity} units from stock`,
                currentStock
            }
        });
    }
    catch (error) {
        if (error.message === "Insufficient stock or product not found") {
            return res.status(409).json({
                ok: false,
                code: "INSUFFICIENT_STOCK",
                message: "Not enough stock available"
            });
        }
        next(error);
    }
});
// Get stock movement history
router.get("/products/:id/stock/history", requireAdmin, async (req, res, next) => {
    try {
        await dbConnect();
        const { id } = IdParam.parse(req.params);
        const limit = parseInt(req.query.limit) || 50;
        const history = await InventoryService.getStockHistory(id, limit);
        res.json({
            ok: true,
            data: history
        });
    }
    catch (error) {
        next(error);
    }
});
export default router;
