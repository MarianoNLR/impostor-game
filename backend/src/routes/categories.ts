import { Router } from "express";
import { getCategories } from "../data/words";

const categoriesRouter = Router();

categoriesRouter.get("/", (_req, res) => {
    const categories = getCategories();
    return res.json({ categories });
});

export default categoriesRouter;
