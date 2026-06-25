-- SEED DATA FOR VIDRAÇARIA ALFA TAHI
-- This migration adds demo data. Run after user signup.

-- First create the function to seed data for a user
CREATE OR REPLACE FUNCTION seed_demo_data(user_uuid UUID)
RETURNS void AS $$
DECLARE
  cat_box UUID;
  cat_sacada UUID;
  cat_janela UUID;
  cat_espelho UUID;
  cat_porta UUID;
  cat_especial UUID;
  client_joao UUID;
  client_maria UUID;
  client_abc UUID;
  client_antonio UUID;
  client_hotel UUID;
  client_carmen UUID;
  client_pedro UUID;
  client_restaurante UUID;
  supplier_vidro UUID;
  supplier_aluminio UUID;
  wo_id UUID;
  bank_caixa UUID;
  bank_bb UUID;
  bank_nubank UUID;
BEGIN
  -- ====================
  -- SERVICE CATEGORIES
  -- ====================
  INSERT INTO service_categories (name, description, user_id) VALUES
    ('Box Banheiro', 'Box de vidro para banheiro', user_uuid),
    ('Fechamento de Sacada', 'Fechamento com vidro temperado para sacadas', user_uuid),
    ('Janelas', 'Janelas de alumínio e vidro', user_uuid),
    ('Espelhos', 'Espelhos decorativos e funcionais', user_uuid),
    ('Portas de Vidro', 'Portas de vidro temperado', user_uuid),
    ('Projetos Especiais', 'Projetos personalizados', user_uuid);

  SELECT id INTO cat_box FROM service_categories WHERE name = 'Box Banheiro' AND user_id = user_uuid LIMIT 1;
  SELECT id INTO cat_sacada FROM service_categories WHERE name = 'Fechamento de Sacada' AND user_id = user_uuid LIMIT 1;
  SELECT id INTO cat_janela FROM service_categories WHERE name = 'Janelas' AND user_id = user_uuid LIMIT 1;
  SELECT id INTO cat_espelho FROM service_categories WHERE name = 'Espelhos' AND user_id = user_uuid LIMIT 1;
  SELECT id INTO cat_porta FROM service_categories WHERE name = 'Portas de Vidro' AND user_id = user_uuid LIMIT 1;
  SELECT id INTO cat_especial FROM service_categories WHERE name = 'Projetos Especiais' AND user_id = user_uuid LIMIT 1;

  -- ====================
  -- CLIENTS
  -- ====================
  INSERT INTO clients (name, email, phone, address, city, document, type, notes, user_id) VALUES
    ('João Silva', 'joao.silva@email.com', '11999887766', 'Rua das Flores, 123 - Centro', 'São Paulo', '123.456.789-00', 'individual', 'Cliente preferencial, sempre paga em dia', user_uuid),
    ('Maria Santos', 'maria.santos@email.com', '11988776655', 'Av. Brasil, 456 - Jardins', 'São Paulo', '987.654.321-00', 'individual', 'Indicou 3 novos clientes', user_uuid),
    ('Construtora ABC Ltda', 'contato@construtoraabc.com.br', '1133445566', 'Rua Industrial, 789 - Distrito Industrial', 'São Paulo', '12.345.678/0001-90', 'company', 'Cliente corporativo, grandes volumes', user_uuid),
    ('Antonio Oliveira', 'antonio.oliveira@email.com', '11977665544', 'Rua Augusta, 321 - Consolação', 'São Paulo', '456.789.123-44', 'individual', 'Cliente exigente, verificar medidas 2x', user_uuid),
    ('Apart Hotel Premium', 'reservas@aparthotel.com.br', '1122334455', 'Av. Paulista, 1000 - Bela Vista', 'São Paulo', '98.765.432/0001-10', 'company', 'Reforma completa de 20 unidades', user_uuid),
    ('Carmen Souza', 'carmen.souza@email.com', '11966554433', 'Rua Oscar Freire, 222 - Pinheiros', 'São Paulo', '321.654.987-55', 'individual', '', user_uuid),
    ('Pedro Mendes', 'pedro.mendes@email.com', '11955443322', 'Alameda Santos, 500 - Jardim América', 'São Paulo', '654.987.321-66', 'individual', 'Arquiteto, traz muitos projetos', user_uuid),
    ('Restaurante Sabor Caseiro', 'contato@saborcaseiro.com.br', '1144556677', 'Rua Pamplona, 300 - Paraíso', 'São Paulo', '45.678.901/0001-23', 'company', '', user_uuid);

  SELECT id INTO client_joao FROM clients WHERE name = 'João Silva' AND user_id = user_uuid LIMIT 1;
  SELECT id INTO client_maria FROM clients WHERE name = 'Maria Santos' AND user_id = user_uuid LIMIT 1;
  SELECT id INTO client_abc FROM clients WHERE name = 'Construtora ABC Ltda' AND user_id = user_uuid LIMIT 1;
  SELECT id INTO client_antonio FROM clients WHERE name = 'Antonio Oliveira' AND user_id = user_uuid LIMIT 1;
  SELECT id INTO client_hotel FROM clients WHERE name = 'Apart Hotel Premium' AND user_id = user_uuid LIMIT 1;
  SELECT id INTO client_carmen FROM clients WHERE name = 'Carmen Souza' AND user_id = user_uuid LIMIT 1;
  SELECT id INTO client_pedro FROM clients WHERE name = 'Pedro Mendes' AND user_id = user_uuid LIMIT 1;
  SELECT id INTO client_restaurante FROM clients WHERE name = 'Restaurante Sabor Caseiro' AND user_id = user_uuid LIMIT 1;

  -- ====================
  -- SUPPLIERS
  -- ====================
  INSERT INTO suppliers (name, email, phone, address, city, document, category, notes, user_id) VALUES
    ('Vidro Temperado Brasil', 'vendas@vidrotemperado.com.br', '1122223333', 'Av. Industrial, 1500 - Guarulhos', 'Guarulhos', '11.111.111/0001-11', 'Vidro', 'Fornecedor principal de vidro temperado. Prazo: 5 dias úteis', user_uuid),
    ('Alumínio Center', 'contato@aluminocenter.com.br', '1133334444', 'Rua dos Metais, 200 - São Miguel', 'São Paulo', '22.222.222/0001-22', 'Alumínio', 'Perfis e acessórios de alumínio', user_uuid),
    ('Ferragens Premium', 'comercial@ferragenspremium.com.br', '1144445555', 'Av. Marginal, 3000 - Osasco', 'Osasco', '33.333.333/0001-33', 'Ferragens', 'Dobradiças, fechaduras, puxadores', user_uuid),
    ('Silicone do Brasil', 'vendas@siliconedobrasil.com.br', '1155556666', 'Rua Química, 100 - Santo Amaro', 'São Paulo', '44.444.444/0001-44', 'Silicone', 'Silicone neutro e estrutural', user_uuid),
    ('Transportadora Express', 'logistica@transportadoraexpress.com.br', '1166667777', 'Av. Transversal, 500 - Barueri', 'Barueri', '55.555.555/0001-55', 'Transporte', 'Entrega de materiais grandes dimensões', user_uuid),
    ('Acessórios Vidro', 'vendas@acessoriosvidro.com.br', '1177778888', 'Rua do Vidraceiro, 50 - Tatuapé', 'São Paulo', '66.666.666/0001-66', 'Acessórios', 'Rodízios, cantoneiras, vedadores', user_uuid);

  SELECT id INTO supplier_vidro FROM suppliers WHERE name = 'Vidro Temperado Brasil' AND user_id = user_uuid LIMIT 1;
  SELECT id INTO supplier_aluminio FROM suppliers WHERE name = 'Alumínio Center' AND user_id = user_uuid LIMIT 1;

  -- ====================
  -- BANK ACCOUNTS
  -- ====================
  INSERT INTO bank_accounts (name, bank_name, agency, account_number, type, initial_balance, current_balance, notes, user_id) VALUES
    ('Caixa Principal', 'Caixa', '', '', 'cash', 5000.00, 12345.67, 'Dinheiro em espécie para pequenas despesas', user_uuid),
    ('Banco do Brasil', 'Banco do Brasil', '1234-5', '67890-1', 'checking', 10000.00, 45678.90, 'Conta corrente principal', user_uuid),
    ('Nubank PJ', 'Nu Pagamentos', '0001', '12345678-9', 'checking', 25000.00, 23000.00, 'Recebimento de clientes via PIX', user_uuid),
    ('Poupança', 'Banco do Brasil', '1234-5', '67890-2', 'savings', 50000.00, 52340.00, 'Reserva de emergência', user_uuid);

  SELECT id INTO bank_caixa FROM bank_accounts WHERE name = 'Caixa Principal' AND user_id = user_uuid LIMIT 1;
  SELECT id INTO bank_bb FROM bank_accounts WHERE name = 'Banco do Brasil' AND user_id = user_uuid LIMIT 1;
  SELECT id INTO bank_nubank FROM bank_accounts WHERE name = 'Nubank PJ' AND user_id = user_uuid LIMIT 1;

  -- ====================
  -- WORK ORDERS
  -- ====================
  
  -- O.S. 1 - Box Banheiro (Completed)
  INSERT INTO work_orders (number, client_id, category_id, title, description, status, total_value, discount, install_address, install_city, install_date, width, height, area, notes, completed_at, user_id)
  VALUES ('OS-2506-0001', client_joao, cat_box, 'Box Banheiro Suíte Master', 'Box de vidro temperado 8mm com perfil dobrável', 'delivered', 1850.00, 0, 'Rua das Flores, 123 - Centro', 'São Paulo', '2025-06-10', 1.80, 2.00, 3.60, 'Cliente satisfeito, indicou amigos', '2025-06-10', user_uuid)
  RETURNING id INTO wo_id;
  
  INSERT INTO work_order_items (work_order_id, description, category, quantity, unit, unit_cost, unit_price, notes, user_id) VALUES
    (wo_id, 'Vidro temperado 8mm cristal', 'glass', 4.0, 'm²', 120.00, 200.00, 'Medida: 2 chapas de 180x200cm', user_uuid),
    (wo_id, 'Perfil dobrável alumínio anodizado', 'aluminum', 4.0, 'm', 25.00, 45.00, 'Perfil 25mm', user_uuid),
    (wo_id, 'Dobradiças em aço inox', 'hardware', 6.0, 'un', 35.00, 55.00, 'Dobradiças pesadas 180°', user_uuid),
    (wo_id, 'Puxador embutido', 'hardware', 1.0, 'un', 80.00, 120.00, 'Puxador de embutir 30cm', user_uuid),
    (wo_id, 'Silicone neutro', 'consumables', 2.0, 'un', 18.00, 25.00, 'Tubo 280g', user_uuid);
  
  INSERT INTO work_order_costs (work_order_id, description, category, amount, date, notes, user_id) VALUES
    (wo_id, 'Instalação completa', 'installation', 150.00, '2025-06-10', '2 instaladores, 4 horas', user_uuid),
    (wo_id, 'Combustível', 'fuel', 45.00, '2025-06-10', 'Percurso ida e volta', user_uuid);

  -- O.S. 2 - Fechamento Sacada (In Progress)
  INSERT INTO work_orders (number, client_id, category_id, title, description, status, total_value, discount, install_address, install_city, install_date, width, height, area, notes, user_id)
  VALUES ('OS-2506-0002', client_maria, cat_sacada, 'Fechamento de Sacada Apartamento', 'Fechamento com vidro temperado 10mm, 3 módulos', 'in_progress', 8500.00, 200.00, 'Av. Brasil, 456 - Jardins', 'São Paulo', '2025-06-25', 8.0, 2.5, 20.0, 'Apartamento no 12º andar, cuidado com acesso', user_uuid)
  RETURNING id INTO wo_id;

  INSERT INTO work_order_items (work_order_id, description, category, quantity, unit, unit_cost, unit_price, notes, user_id) VALUES
    (wo_id, 'Vidro temperado 10mm cristal', 'glass', 22.0, 'm²', 180.00, 280.00, 'Inclui 10% sobra', user_uuid),
    (wo_id, 'Perfil U alumínio 25mm', 'aluminum', 20.0, 'm', 28.00, 48.00, 'Perfil de fixação', user_uuid),
    (wo_id, 'Perfil de encontro', 'aluminum', 8.0, 'm', 35.00, 60.00, 'Para fechamento', user_uuid),
    (wo_id, 'Roldanas duplas', 'hardware', 6.0, 'un', 45.00, 75.00, 'Sistema deslizante', user_uuid),
    (wo_id, 'Trinco de segurança', 'hardware', 3.0, 'un', 25.00, 45.00, 'Fechamento lateral', user_uuid);

  INSERT INTO work_order_costs (work_order_id, description, category, amount, date, notes, user_id) VALUES
    (wo_id, 'Mão de obra instalação', 'labor', 800.00, '2025-06-25', 'Previsto', user_uuid),
    (wo_id, 'Equipamento elevação', 'equipment', 350.00, '2025-06-25', 'Guincho para 12º andar', user_uuid);

  -- O.S. 3 - Janelas Company (Approved)
  INSERT INTO work_orders (number, client_id, category_id, title, description, status, total_value, discount, install_address, install_city, install_date, width, height, area, notes, user_id)
  VALUES ('OS-2506-0003', client_abc, cat_janela, 'Janelas Prédio Comercial - Fase 1', '50 janelas de alumínio com vidro 6mm', 'approved', 45000.00, 1500.00, 'Rua Industrial, 789 - Distrito Industrial', 'São Paulo', '2025-06-30', NULL, NULL, NULL, 'Primeira fase de 3. Material já encomendado.', user_uuid)
  RETURNING id INTO wo_id;

  INSERT INTO work_order_items (work_order_id, description, category, quantity, unit, unit_cost, unit_price, notes, user_id) VALUES
    (wo_id, 'Vidro comum 6mm cristal', 'glass', 100.0, 'm²', 85.00, 130.00, 'Janelas 1x2m', user_uuid),
    (wo_id, 'Marco de alumínio branco', 'aluminum', 200.0, 'm', 22.00, 38.00, 'Série 25', user_uuid),
    (wo_id, 'Fechadura tipo cremona', 'hardware', 50.0, 'un', 45.00, 75.00, 'Fechamento central', user_uuid);

  -- O.S. 4 - Espelho (Budget)
  INSERT INTO work_orders (number, client_id, category_id, title, description, status, total_value, discount, install_address, install_city, install_date, width, height, area, notes, user_id)
  VALUES ('OS-2506-0004', client_carmen, cat_espelho, 'Espelho Banheiro Social', 'Espelho 4mm com moldura', 'budget', 450.00, 0, 'Rua Oscar Freire, 222 - Pinheiros', 'São Paulo', '2025-06-28', 1.20, 0.80, 0.96, 'Aguardando aprovação', user_uuid);

  -- O.S. 5 - Porta Vidro (Completed)
  INSERT INTO work_orders (number, client_id, category_id, title, description, status, total_value, discount, install_address, install_city, install_date, width, height, area, notes, completed_at, user_id)
  VALUES ('OS-2506-0005', client_antonio, cat_porta, 'Porta de Vidro Temperado Escritório', 'Porta pivotante de vidro 10mm', 'delivered', 3200.00, 0, 'Rua Augusta, 321 - Consolação', 'São Paulo', '2025-06-15', 1.0, 2.2, 2.2, 'Com fechadura eletromagnética', '2025-06-15', user_uuid)
  RETURNING id INTO wo_id;

  INSERT INTO work_order_items (work_order_id, description, category, quantity, unit, unit_cost, unit_price, user_id) VALUES
    (wo_id, 'Vidro temperado 10mm', 'glass', 2.5, 'm²', 190.00, 300.00, user_uuid),
    (wo_id, 'Dobradiça pivotante', 'hardware', 2.0, 'un', 180.00, 280.00, user_uuid),
    (wo_id, 'Fechadura eletromagnética', 'hardware', 1.0, 'un', 350.00, 520.00, user_uuid),
    (wo_id, 'Fechadura cilíndrica', 'hardware', 1.0, 'un', 85.00, 130.00, user_uuid);

  INSERT INTO work_order_costs (work_order_id, description, category, amount, date, user_id) VALUES
    (wo_id, 'Instalação', 'installation', 200.00, '2025-06-15', user_uuid),
    (wo_id, 'Eletricista (fechadura)', 'labor', 150.00, '2025-06-15', user_uuid);

  -- O.S. 6 - Hotel Project (In Progress)
  INSERT INTO work_orders (number, client_id, category_id, title, description, status, total_value, discount, install_address, install_city, install_date, width, height, area, notes, user_id)
  VALUES ('OS-2506-0006', client_hotel, cat_especial, 'Reforma Apart Hotel - 20 Unidades', 'Boxes e espelhos para 20 apartamentos', 'in_progress', 95000.00, 3000.00, 'Av. Paulista, 1000 - Bela Vista', 'São Paulo', '2025-07-15', NULL, NULL, NULL, 'Projeto grande. Prazo 30 dias. 50% adiantado.', user_uuid)
  RETURNING id INTO wo_id;

  INSERT INTO work_order_items (work_order_id, description, category, quantity, unit, unit_cost, unit_price, user_id) VALUES
    (wo_id, 'Vidro temperado 8mm para boxes', 'glass', 80.0, 'm²', 120.00, 200.00, user_uuid),
    (wo_id, 'Espelhos 4mm', 'glass', 40.0, 'm²', 75.00, 130.00, user_uuid),
    (wo_id, 'Perfis alumínio para box', 'aluminum', 160.0, 'm', 25.00, 45.00, user_uuid),
    (wo_id, 'Acessórios box (dobradiças, puxadores)', 'hardware', 60.0, 'un', 40.00, 65.00, user_uuid);

  -- O.S. 7 - Orçamento Restaurante
  INSERT INTO work_orders (number, client_id, category_id, title, description, status, total_value, discount, install_address, install_city, install_date, width, height, area, notes, user_id)
  VALUES ('OS-2506-0007', client_restaurante, cat_especial, 'Fachada de Vidro Restaurante', 'Showroom de vidro temperado na fachada', 'budget', 18000.00, 0, 'Rua Pamplona, 300 - Paraíso', 'São Paulo', '2025-07-01', 6.0, 3.0, 18.0, 'Projeto aguardando aprovação da prefeitura', user_uuid);

  -- O.S. 8 - Janelas Pedro
  INSERT INTO work_orders (number, client_id, category_id, title, description, status, total_value, discount, install_address, install_city, install_date, width, height, area, notes, completed_at, user_id)
  VALUES ('OS-2506-0008', client_pedro, cat_janela, 'Substituição Janelas Apartamento', '6 janelas maxi-ar com vidro 6mm', 'delivered', 4800.00, 300.00, 'Alameda Santos, 500 - Jardim América', 'São Paulo', '2025-06-18', NULL, NULL, NULL, 'Cliente arquiteto, projeto indicado por ele', '2025-06-18', user_uuid)
  RETURNING id INTO wo_id;

  INSERT INTO work_order_items (work_order_id, description, category, quantity, unit, unit_cost, unit_price, user_id) VALUES
    (wo_id, 'Vidro 6mm cristal', 'glass', 18.0, 'm²', 85.00, 130.00, user_uuid),
    (wo_id, 'Perfis alumínio série 25', 'aluminum', 36.0, 'm', 22.00, 38.00, user_uuid),
    (wo_id, 'Kit maxi-ar completo', 'hardware', 6.0, 'un', 85.00, 140.00, user_uuid);

  INSERT INTO work_order_costs (work_order_id, description, category, amount, date, user_id) VALUES
    (wo_id, 'Instalação', 'installation', 350.00, '2025-06-18', user_uuid);

  -- ====================
  -- ACCOUNTS RECEIVABLE
  -- ====================
  
  SELECT id INTO wo_id FROM work_orders WHERE number = 'OS-2506-0001' AND user_id = user_uuid LIMIT 1;
  INSERT INTO accounts_receivable (client_id, work_order_id, description, total_amount, received_amount, due_date, receipt_date, status, payment_method, user_id) VALUES
    (client_joao, wo_id, 'Box Banheiro - OS-2506-0001', 1850.00, 1850.00, '2025-06-05', '2025-06-05', 'received', 'pix', user_uuid);

  SELECT id INTO wo_id FROM work_orders WHERE number = 'OS-2506-0005' AND user_id = user_uuid LIMIT 1;
  INSERT INTO accounts_receivable (client_id, work_order_id, description, total_amount, received_amount, due_date, receipt_date, status, payment_method, card_fee_percent, user_id) VALUES
    (client_antonio, wo_id, 'Porta Vidro - OS-2506-0005', 3200.00, 1600.00, '2025-06-15', '2025-06-15', 'partial', 'credit', 3.5, user_uuid);
  
  INSERT INTO accounts_receivable (client_id, work_order_id, description, total_amount, received_amount, due_date, status, payment_method, installment_number, total_installments, user_id) VALUES
    (client_antonio, wo_id, 'Porta Vidro - OS-2506-0005 - Parcela 2/2', 1600.00, 0, '2025-07-15', 'pending', 'credit', 2, 2, user_uuid);

  SELECT id INTO wo_id FROM work_orders WHERE number = 'OS-2506-0008' AND user_id = user_uuid LIMIT 1;
  INSERT INTO accounts_receivable (client_id, work_order_id, description, total_amount, received_amount, due_date, receipt_date, status, payment_method, user_id) VALUES
    (client_pedro, wo_id, 'Janelas - OS-2506-0008', 4800.00, 4800.00, '2025-06-10', '2025-06-10', 'received', 'transfer', user_uuid);

  SELECT id INTO wo_id FROM work_orders WHERE number = 'OS-2506-0006' AND user_id = user_uuid LIMIT 1;
  INSERT INTO accounts_receivable (client_id, work_order_id, description, total_amount, received_amount, due_date, receipt_date, status, payment_method, user_id) VALUES
    (client_hotel, wo_id, 'Apart Hotel - Sinal 50%', 46000.00, 46000.00, '2025-06-20', '2025-06-20', 'received', 'transfer', user_uuid);
  
  INSERT INTO accounts_receivable (client_id, work_order_id, description, total_amount, received_amount, due_date, expected_date, status, payment_method, user_id) VALUES
    (client_hotel, wo_id, 'Apart Hotel - Saldo 50%', 46000.00, 0, '2025-07-15', '2025-07-15', 'pending', 'transfer', user_uuid);

  SELECT id INTO wo_id FROM work_orders WHERE number = 'OS-2506-0002' AND user_id = user_uuid LIMIT 1;
  INSERT INTO accounts_receivable (client_id, work_order_id, description, total_amount, received_amount, due_date, status, payment_method, user_id) VALUES
    (client_maria, wo_id, 'Fechamento Sacada - OS-2506-0002', 8300.00, 0, '2025-06-20', 'pending', 'pix', user_uuid);

  -- ====================
  -- ACCOUNTS PAYABLE
  -- ====================

  INSERT INTO accounts_payable (supplier_id, description, category, subcategory, total_amount, paid_amount, due_date, payment_date, status, payment_method, document_number, notes, user_id) VALUES
    (supplier_vidro, 'Vidro temperado 8mm e 10mm - Lote Junho', 'variable', 'Vidro', 8500.00, 8500.00, '2025-06-05', '2025-06-05', 'paid', 'transfer', 'NF-2025-089', 'Estoque reforçado', user_uuid),
    (supplier_aluminio, 'Perfis alumínio série 25 e 30', 'variable', 'Alumínio', 3200.00, 3200.00, '2025-06-08', '2025-06-08', 'paid', 'transfer', 'NF-2025-102', 'Pedido semanal', user_uuid);

  INSERT INTO accounts_payable (supplier_id, description, category, subcategory, total_amount, paid_amount, due_date, status, payment_method, document_number, notes, user_id) VALUES
    (supplier_vidro, 'Vidro temperado projeto hotel - 80m²', 'variable', 'Vidro', 9600.00, 0, '2025-06-28', 'pending', 'transfer', 'NF-2025-145', 'Para projeto Apart Hotel', user_uuid);

  INSERT INTO accounts_payable (description, category, subcategory, total_amount, paid_amount, due_date, payment_date, status, payment_method, is_recurring, recurrence_frequency, notes, user_id) VALUES
    ('Aluguel Galpão', 'fixed', 'Aluguel', 3500.00, 3500.00, '2025-06-10', '2025-06-10', 'paid', 'boleto', true, 'monthly', 'Contrato vigente até Dez/2025', user_uuid),
    ('Aluguel Galpão - Julho', 'fixed', 'Aluguel', 3500.00, 0, '2025-07-10', NULL, 'pending', NULL, true, 'monthly', 'Recorrência mensal', user_uuid),
    ('Energia Elétrica', 'fixed', 'Energia', 890.50, 890.50, '2025-06-15', '2025-06-15', 'paid', 'pix', false, NULL, 'Média consumo', user_uuid),
    ('Internet Vivo Empresas', 'fixed', 'Internet', 189.90, 189.90, '2025-06-20', '2025-06-20', 'paid', 'pix', true, 'monthly', '300Mbps dedicado', user_uuid),
    ('Internet - Julho', 'fixed', 'Internet', 189.90, 0, '2025-07-20', NULL, 'pending', NULL, true, 'monthly', '', user_uuid);

  INSERT INTO accounts_payable (description, category, subcategory, total_amount, paid_amount, due_date, status, notes, user_id) VALUES
    ('Reserva 13º Salário', 'provision', 'Décimo Terceiro', 2500.00, 0, '2025-11-30', 'pending', 'Provisão mensal 1/12', user_uuid),
    ('Reserva Férias', 'provision', 'Férias', 1200.00, 0, '2025-12-15', 'pending', 'Provisão mensal 1/12', user_uuid),
    ('Manutenção Frota', 'provision', 'Manutenção Veículo', 500.00, 0, '2025-07-15', 'pending', 'Reserva mensal', user_uuid);

  -- ====================
  -- CASH TRANSACTIONS
  -- ====================

  INSERT INTO cash_transactions (bank_account_id, type, category, description, amount, date, user_id) VALUES
    (bank_nubank, 'income', 'receivable', 'Recebimento OS-2506-0001 - João Silva', 1850.00, '2025-06-05', user_uuid),
    (bank_bb, 'income', 'receivable', 'Recebimento parcial OS-2506-0005 - Antonio', 1600.00, '2025-06-15', user_uuid),
    (bank_nubank, 'income', 'receivable', 'Sinal projeto Hotel 50%', 46000.00, '2025-06-20', user_uuid),
    (bank_bb, 'income', 'receivable', 'Recebimento OS-2506-0008 - Pedro Mendes', 4800.00, '2025-06-10', user_uuid);

  INSERT INTO cash_transactions (bank_account_id, type, category, subcategory, description, amount, date, user_id) VALUES
    (bank_bb, 'expense', 'variable', 'Vidro', 'Pagamento Vidro Temperado Brasil', 8500.00, '2025-06-05', user_uuid),
    (bank_bb, 'expense', 'variable', 'Alumínio', 'Pagamento Alumínio Center', 3200.00, '2025-06-08', user_uuid),
    (bank_bb, 'expense', 'fixed', 'Aluguel', 'Aluguel galpão Junho', 3500.00, '2025-06-10', user_uuid),
    (bank_caixa, 'expense', 'fixed', 'Energia', 'Conta luz Junho', 890.50, '2025-06-15', user_uuid),
    (bank_nubank, 'expense', 'fixed', 'Internet', 'Internet Vive Empresas', 189.90, '2025-06-20', user_uuid),
    (bank_caixa, 'expense', 'variable', 'Insumos', 'Silicone e consumíveis', 156.80, '2025-06-12', user_uuid),
    (bank_caixa, 'expense', 'variable', 'Ferragens', 'Dobradiças e puxadores', 430.00, '2025-06-14', user_uuid);

  -- ====================
  -- LOSSES/WASTE
  -- ====================
  INSERT INTO losses (work_order_id, description, category, material, quantity, unit, unit_cost, cause, responsible, notes, date, user_id)
  SELECT wo_id, 'Vidro 8mm quebrou durante corte', 'broken', 'Vidro temperado 8mm', 1.5, 'm²', 120.00, 'Erro de medida no corte', 'Carlos - cortador', 'Chapa inteira perdida. Refazer medição.', '2025-06-08', user_uuid
  FROM work_orders WHERE number = 'OS-2506-0002' AND user_id = user_uuid LIMIT 1;

  INSERT INTO losses (work_order_id, description, category, material, quantity, unit, unit_cost, cause, responsible, notes, date, user_id)
  SELECT wo_id, 'Vidro trincou no transporte', 'transport', 'Vidro temperado 10mm', 2.2, 'm²', 190.00, 'Frete inadequado', 'Transportadora Express', 'Cobrar transportadora. Seguro acionado.', '2025-06-12', user_uuid
  FROM work_orders WHERE number = 'OS-2506-0006' AND user_id = user_uuid LIMIT 1;

  INSERT INTO losses (description, category, material, quantity, unit, unit_cost, cause, responsible, notes, date, user_id) VALUES
    ('Corte errado perfil alumínio', 'cut_error', 'Perfil U alumínio 25mm', 6.0, 'm', 28.00, 'Medida invertida', 'Pedro - serralheiro', 'Perdas por erro de interpretação do projeto', '2025-06-15', user_uuid),
    ('Retrabalho instalação janela', 'rework', 'Mão de obra', 4.0, 'h', 50.00, 'Nivelamento incorreto', 'Equipe instalação', 'Janela instalada torta, precisou reinstalar', '2025-06-16', user_uuid);

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Execute the seed function for existing user
SELECT seed_demo_data((SELECT id FROM auth.users LIMIT 1));

-- Clean up the function after use
DROP FUNCTION IF EXISTS seed_demo_data(UUID);
