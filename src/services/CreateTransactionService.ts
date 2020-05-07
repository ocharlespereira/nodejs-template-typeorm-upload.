import { getCustomRepository, getRepository } from 'typeorm';
import AppError from '../errors/AppError';

import TransactionsRepository from '../repositories/TransactionsRepository';

import Transaction from '../models/Transaction';
import Category from '../models/Category';

interface Request {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category,
  }: Request): Promise<Transaction> {
    const transactionsRepository = getCustomRepository(TransactionsRepository);
    const categoryRepository = getRepository(Category);

    // retorna o total
    const { total } = await transactionsRepository.getBalance();

    // verifica se o total é maior que o saldo, se for trazer erro, pois o saldo nao pode ser negativo
    if (type === 'outcome' && total < value) {
      throw new AppError('You do not have enough balance');
    }

    // verifica se existe a categoria
    let transactionCategory = await categoryRepository.findOne({
      where: {
        title: category,
      },
    });

    // caso a categoria nao exista a variavel irá receber outro dado pois está setada como let
    if (!transactionCategory) {
      transactionCategory = categoryRepository.create({ title: category });

      await categoryRepository.save(transactionCategory);
    }

    const transaction = transactionsRepository.create({
      title,
      value,
      type,
      category: transactionCategory,
    });

    await transactionsRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
