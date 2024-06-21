import { expect } from 'chai';
import request from 'supertest';
import app from '../testServer.js';
import User from '../../models/user/userModel.js';
import generateToken from '../utils/generateToken.mjs';
import Expense from '../../models/expense/expenseModel.js';
import ExpenseCategory from '../../models/expense/expenseCategoryModel.js';
import Account from '../../models/account/accountModel.js';
import ExpenseCategoryLimit from '../../models/expense/expenseCategoryLimitModel.js';

describe('PUT /api/expense/updateExpense',function ()  {
    this.timeout(10000);
    let token, user, expenseId, oldAccount, newAccount,category1, oldCategory,category, account, categoryLimit, newCategory, oldCategoryLimit, newCategoryLimit;

    before(async () => {
        user = new User({ _id:"111111" });
        await user.save();
        token = generateToken(user._id);

        // Створення об'єктів для тестів
        oldAccount = new Account({name:"Card1", balance: 1000, userId: user._id });
        newAccount = new Account({name:"Card2", balance: 1000, userId: user._id });
        category1 = new ExpenseCategory({ name: 'Category', userId: user._id });
        oldCategory = new ExpenseCategory({ name: 'Old Category', userId: user._id });
        newCategory = new ExpenseCategory({ name: 'New Category', userId: user._id });
        oldCategoryLimit = new ExpenseCategoryLimit({
            categoryId: category1._id,
            limit: 500,
            currentExpense: 700,
            month: new Date().getMonth() + 1,
            year: new Date().getFullYear()
        });
        newCategoryLimit = new ExpenseCategoryLimit({
            categoryId: newCategory._id,
            limit: 500,
            currentExpense: 0,
            month: new Date().getMonth() + 1,
            year: new Date().getFullYear()
        });

        category = await ExpenseCategory.create({ name: 'Test Category', userId: user._id });
        account = await Account.create({ name: "Cash", balance: 2000, userId: user._id });
        categoryLimit = await ExpenseCategoryLimit.create({
            categoryId: category._id,
            limit: 1000,
            currentExpense: 0,
            month: 6,
            year: 2024
        });

        await oldAccount.save();
        await newAccount.save();
        await oldCategory.save();
        await newCategory.save();
        await oldCategoryLimit.save();
        await newCategoryLimit.save();

    });

    after(async () => {
        // Очищення бази даних після тестів
        await User.deleteMany({});
        await Expense.deleteMany({});
        await Account.deleteMany({});
        await ExpenseCategory.deleteMany({});
        await ExpenseCategoryLimit.deleteMany({});
    });

    it('should update expense amount', async () => {
        const updatedAmount = 500;

        const expense = await Expense.create({
            userId: user._id,
            categoryId: oldCategory._id,
            account: oldAccount._id,
            amount: 200,
            date: new Date(),
        });


        expenseId = expense._id;

        const res = await request(app)
            .put(`/api/expense/updateExpense/${expenseId}`)
            .send({
                categoryId: oldCategory._id,
                account: oldAccount._id,
                amount: updatedAmount,
                note: "hhh",
                date: new Date(), })
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).to.equal(200);

        const updatedExpense = await Expense.findById(expenseId);

        expect(updatedExpense.amount).to.equal(updatedAmount);
    });


    it('should update expense category and update category limits', async () => {
        const expense = await Expense.create({
            userId: user._id,
            categoryId: category1._id,
            account: oldAccount._id,
            amount: 200,
            date: new Date(),
        });

        expenseId = expense._id;

        const res = await request(app)
            .put(`/api/expense/updateExpense/${expenseId}`)
            .send({
                categoryId: newCategory._id,
                account: oldAccount._id,
                amount: 200,
                note: "Updated category",
                date: new Date(),
            })
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).to.equal(200);

        const updatedExpense = await Expense.findById(expenseId);

        expect(updatedExpense.categoryId.toString()).to.equal(newCategory._id.toString());

        const updatedOldCategoryLimit = await ExpenseCategoryLimit.findById(oldCategoryLimit._id);
        const updatedNewCategoryLimit = await ExpenseCategoryLimit.findById(newCategoryLimit._id);


        expect(updatedOldCategoryLimit.currentExpense).to.equal(500);
        expect(updatedNewCategoryLimit.currentExpense).to.equal(200);
    });


    it('should update both amount and category and update category limits accordingly', async () => {
        const initialAmount = 200;
        const updatedAmount = 300;

        const expense = await Expense.create({
            userId: user._id,
            categoryId: oldCategory._id,
            account: oldAccount._id,
            amount: initialAmount,
            date: new Date(),
        });

        expenseId = expense._id;


        const res = await request(app)
            .put(`/api/expense/updateExpense/${expenseId}`)
            .send({
                categoryId: newCategory._id,
                account: oldAccount._id,
                amount: updatedAmount,
                note: "Updated amount and category",
                date: new Date(),
            })
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).to.equal(200);

        const updatedExpense = await Expense.findById(expenseId);

        expect(updatedExpense.amount).to.equal(updatedAmount);
        expect(updatedExpense.categoryId.toString()).to.equal(newCategory._id.toString());


        const updatedOldCategoryLimit = await ExpenseCategoryLimit.findById(oldCategoryLimit._id);
        const updatedNewCategoryLimit = await ExpenseCategoryLimit.findById(newCategoryLimit._id);

        expect(updatedOldCategoryLimit.currentExpense).to.equal(500);
        expect(updatedNewCategoryLimit.currentExpense).to.equal(500);
    });


});




