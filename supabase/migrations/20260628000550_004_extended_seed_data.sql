-- EXTENDED SEED DATA - MULTIPLE MONTHS
-- This migration adds extensive historical data for dashboards and reports

CREATE OR REPLACE FUNCTION seed_extended_data(user_uuid UUID)
RETURNS void AS $$
DECLARE
  -- Categories
  cat_box UUID;
  cat_sacada UUID;
  cat_janela UUID;
  cat_espelho UUID;
  cat_porta UUID;
  cat_especial UUID;
  
  -- Clients
  client_joao UUID;
  client_maria UUID;
  client_abc UUID;
  client_antonio UUID;
  client_hotel UUID;
  client_carmen UUID;
  client_pedro UUID;
  client_restaurante UUID;
  client_roberto UUID;
  client_fernanda UUID;
  client_construtora UUID;
  client_clinica UUID;
  client_escola UUID;
  client_padaria UUID;
  client_academia UUID;
  client_imobiliaria UUID;
  client_loja UUID;
  client_escritorio UUID;
  client_residencial1 UUID;
  client_residencial2 UUID;
  
  -- Suppliers
  supplier_vidro UUID;
  supplier_aluminio UUID;
  supplier_ferragens UUID;
  supplier_vidro2 UUID;
  
  -- Bank accounts
  bank_caixa UUID;
  bank_bb UUID;
  bank_nubank UUID;
  bank_itau UUID;
  
BEGIN
  -- Get existing categories
  SELECT id INTO cat_box FROM service_categories WHERE name = 'Box Banheiro' AND user_id = user_uuid LIMIT 1;
  SELECT id INTO cat_sacada FROM service_categories WHERE name = 'Fechamento de Sacada' AND user_id = user_uuid LIMIT 1;
  SELECT id INTO cat_janela FROM service_categories WHERE name = 'Janelas' AND user_id = user_uuid LIMIT 1;
  SELECT id INTO cat_espelho FROM service_categories WHERE name = 'Espelhos' AND user_id = user_uuid LIMIT 1;
  SELECT id INTO cat_porta FROM service_categories WHERE name = 'Portas de Vidro' AND user_id = user_uuid LIMIT 1;
  SELECT id INTO cat_especial FROM service_categories WHERE name = 'Projetos Especiais' AND user_id = user_uuid LIMIT 1;
  
  -- Get existing clients
  SELECT id INTO client_joao FROM clients WHERE name = 'João Silva' AND user_id = user_uuid LIMIT 1;
  SELECT id INTO client_maria FROM clients WHERE name = 'Maria Santos' AND user_id = user_uuid LIMIT 1;
  SELECT id INTO client_abc FROM clients WHERE name = 'Construtora ABC Ltda' AND user_id = user_uuid LIMIT 1;
  SELECT id INTO client_antonio FROM clients WHERE name = 'Antonio Oliveira' AND user_id = user_uuid LIMIT 1;
  SELECT id INTO client_hotel FROM clients WHERE name = 'Apart Hotel Premium' AND user_id = user_uuid LIMIT 1;
  SELECT id INTO client_carmen FROM clients WHERE name = 'Carmen Souza' AND user_id = user_uuid LIMIT 1;
  SELECT id INTO client_pedro FROM clients WHERE name = 'Pedro Mendes' AND user_id = user_uuid LIMIT 1;
  SELECT id INTO client_restaurante FROM clients WHERE name = 'Restaurante Sabor Caseiro' AND user_id = user_uuid LIMIT 1;
  
  -- Get existing suppliers
  SELECT id INTO supplier_vidro FROM suppliers WHERE name = 'Vidro Temperado Brasil' AND user_id = user_uuid LIMIT 1;
  SELECT id INTO supplier_aluminio FROM suppliers WHERE name = 'Alumínio Center' AND user_id = user_uuid LIMIT 1;
  SELECT id INTO supplier_ferragens FROM suppliers WHERE name = 'Ferragens Premium' AND user_id = user_uuid LIMIT 1;
  
  -- Get existing banks
  SELECT id INTO bank_caixa FROM bank_accounts WHERE name = 'Caixa Principal' AND user_id = user_uuid LIMIT 1;
  SELECT id INTO bank_bb FROM bank_accounts WHERE name = 'Banco do Brasil' AND user_id = user_uuid LIMIT 1;
  SELECT id INTO bank_nubank FROM bank_accounts WHERE name = 'Nubank PJ' AND user_id = user_uuid LIMIT 1;

  -- NEW CLIENTS
  INSERT INTO clients (name, email, phone, address, city, document, type, notes, user_id) VALUES
    ('Roberto Costa', 'roberto.costa@email.com', '11944556677', 'Rua Augusta, 1500 - Consolação', 'São Paulo', '111.222.333-44', 'individual', 'Cliente novo', user_uuid),
    ('Fernanda Lima', 'fernanda.lima@email.com', '11933445566', 'Av. Faria Lima, 2000 - Itaim Bibi', 'São Paulo', '444.555.666-77', 'individual', 'Arquiteta', user_uuid),
    ('Construtora XYZ S.A.', 'comercial@constxyz.com.br', '1122223333', 'Av. Berrini, 550 - Brooklin', 'São Paulo', '55.666.777/0001-88', 'company', 'Grande construtora', user_uuid),
    ('Clínica Saúde Total', 'fin@clinicasaude.com.br', '1133334444', 'Rua Estados Unidos, 100 - Jardim América', 'São Paulo', '66.777.888/0001-99', 'company', 'Reforma recepção', user_uuid),
    ('Escola Viva Learning', 'dir@escolaviva.com.br', '1144445555', 'Alameda Lorena, 800 - Jardim Paulista', 'São Paulo', '77.888.999/0001-11', 'company', 'Janelas e divisórias', user_uuid),
    ('Padaria Central', 'cont@padariacentral.com.br', '1155556666', 'Rua Pamplona, 500 - Paraíso', 'São Paulo', '88.999.111/0001-22', 'company', 'Fachada vidro', user_uuid),
    ('Academia Power Fit', 'admin@powerfit.com.br', '1166667777', 'Av. Brasil, 3000 - Jardins', 'São Paulo', '99.111.222/0001-33', 'company', 'Espelhos academia', user_uuid),
    ('Imobiliária Premier', 'lucas@imobpremier.com.br', '1177778888', 'Rua Oscar Freire, 1000 - Pinheiros', 'São Paulo', '11.222.333/0001-44', 'company', 'Parceria reformas', user_uuid),
    ('Loja Moderna Móveis', 'vendas@lojamoderna.com.br', '1188889999', 'Av. Paulista, 2000 - Bela Vista', 'São Paulo', '22.333.444/0001-55', 'company', 'Vitrines', user_uuid),
    ('Escritório Advocacia', 'adm@advsilva.com.br', '1199990000', 'Rua Consolação, 1500', 'São Paulo', '33.444.555/0001-66', 'company', 'Divisórias vidro', user_uuid),
    ('Edifício Solar Andes', 'sindico@solarandes.com.br', '1190001111', 'Av. Andes, 500 - Santo Amaro', 'São Paulo', '44.555.666/0001-77', 'company', 'Condomínio 40 unid', user_uuid),
    ('Casa Residencial Green', 'marcio.green@email.com', '1191112222', 'Rua Palmeiras, 300 - Moema', 'São Paulo', '555.666.777-88', 'individual', 'Casa completa', user_uuid)
  ON CONFLICT DO NOTHING;

  -- Get new client IDs
  SELECT id INTO client_roberto FROM clients WHERE name = 'Roberto Costa' AND user_id = user_uuid LIMIT 1;
  SELECT id INTO client_fernanda FROM clients WHERE name = 'Fernanda Lima' AND user_id = user_uuid LIMIT 1;
  SELECT id INTO client_construtora FROM clients WHERE name = 'Construtora XYZ S.A.' AND user_id = user_uuid LIMIT 1;
  SELECT id INTO client_clinica FROM clients WHERE name = 'Clínica Saúde Total' AND user_id = user_uuid LIMIT 1;
  SELECT id INTO client_escola FROM clients WHERE name = 'Escola Viva Learning' AND user_id = user_uuid LIMIT 1;
  SELECT id INTO client_padaria FROM clients WHERE name = 'Padaria Central' AND user_id = user_uuid LIMIT 1;
  SELECT id INTO client_academia FROM clients WHERE name = 'Academia Power Fit' AND user_id = user_uuid LIMIT 1;
  SELECT id INTO client_imobiliaria FROM clients WHERE name = 'Imobiliária Premier' AND user_id = user_uuid LIMIT 1;
  SELECT id INTO client_loja FROM clients WHERE name = 'Loja Moderna Móveis' AND user_id = user_uuid LIMIT 1;
  SELECT id INTO client_escritorio FROM clients WHERE name = 'Escritório Advocacia' AND user_id = user_uuid LIMIT 1;
  SELECT id INTO client_residencial1 FROM clients WHERE name = 'Edifício Solar Andes' AND user_id = user_uuid LIMIT 1;
  SELECT id INTO client_residencial2 FROM clients WHERE name = 'Casa Residencial Green' AND user_id = user_uuid LIMIT 1;

  -- NEW SUPPLIERS
  INSERT INTO suppliers (name, email, phone, address, city, document, category, notes, user_id) VALUES
    ('Cristal Vidros', 'com@cristalvidros.com.br', '1191234567', 'Av. Industrial, 2000 - Guarulhos', 'Guarulhos', '12.345.678/0001-90', 'Vidro', 'Fornecedor secundário', user_uuid)
  ON CONFLICT DO NOTHING;
  SELECT id INTO supplier_vidro2 FROM suppliers WHERE name = 'Cristal Vidros' AND user_id = user_uuid LIMIT 1;

  -- NEW BANK ACCOUNT
  INSERT INTO bank_accounts (name, bank_name, agency, account_number, type, initial_balance, current_balance, notes, user_id) VALUES
    ('Itau PJ', 'Itaú Unibanco', '8765-4', '32109-8', 'checking', 15000.00, 28000.00, 'Conta fornecedores', user_uuid)
  ON CONFLICT DO NOTHING;
  SELECT id INTO bank_itau FROM bank_accounts WHERE name = 'Itau PJ' AND user_id = user_uuid LIMIT 1;

  -- QUOTES - January (payment_method: pix, cash, debit, credit, installment)
  INSERT INTO quotes (number, client_id, client_name, title, description, status, total_value, valid_until, payment_method, installment_count, notes, created_at, user_id) VALUES
    ('OR-2501-0001', client_roberto, 'Roberto Costa', 'Box Banheiro Suite', 'Box vidro 8mm com perfil dobrável', 'approved', 1950.00, '2025-01-31', 'pix', 1, 'Aprovado rápido', '2025-01-05T10:00:00', user_uuid),
    ('OR-2501-0002', client_fernanda, 'Fernanda Lima', 'Fechamento Sacada Penthouse', 'Fechamento 6 módulos vidro 10mm', 'approved', 15500.00, '2025-01-31', 'debit', 2, 'Projeto alto padrão', '2025-01-08T14:30:00', user_uuid),
    ('OR-2501-0003', client_padaria, 'Padaria Central', 'Fachada Vidro Temperado', 'Fachada vidro 12mm', 'expired', 8500.00, '2025-01-25', 'debit', 1, 'Cliente não respondeu', '2025-01-10T09:00:00', user_uuid),
    ('OR-2501-0004', client_joao, 'João Silva', 'Box Banheiro Social', 'Box vidro 8mm simples', 'cancelled', 850.00, '2025-01-28', 'cash', 1, 'Cliente desistiu', '2025-01-12T11:00:00', user_uuid)
  ON CONFLICT DO NOTHING;

  -- QUOTES - February
  INSERT INTO quotes (number, client_id, client_name, title, description, status, total_value, valid_until, payment_method, installment_count, notes, created_at, user_id) VALUES
    ('OR-2502-0001', client_construtora, 'Construtora XYZ S.A.', 'Janelas Prédio Residencial', '80 janelas maxi-ar vidro 6mm', 'approved', 78000.00, '2025-02-28', 'debit', 3, 'Contrato grande', '2025-02-03T08:00:00', user_uuid),
    ('OR-2502-0002', client_clinica, 'Clínica Saúde Total', 'Divisórias Vidro Recepção', 'Divisórias vidro 10mm com porta', 'approved', 4500.00, '2025-02-25', 'credit', 2, 'Projeto urgente', '2025-02-07T15:00:00', user_uuid),
    ('OR-2502-0003', client_maria, 'Maria Santos', 'Espelho Banheiro', 'Espelho 4mm com moldura', 'approved', 380.00, '2025-02-20', 'pix', 1, 'Cliente antigo', '2025-02-12T10:30:00', user_uuid),
    ('OR-2502-0004', client_escola, 'Escola Viva Learning', 'Janelas Salas de Aula', '25 janelas vidro laminado', 'negotiation', 35000.00, '2025-03-15', 'debit', 4, 'Em negociação', '2025-02-18T09:00:00', user_uuid),
    ('OR-2502-0005', client_academia, 'Academia Power Fit', 'Espelhos Parede', 'Espelhos 6mm 30m lineares', 'approved', 12500.00, '2025-02-28', 'debit', 2, 'Espelhos academia', '2025-02-22T14:00:00', user_uuid)
  ON CONFLICT DO NOTHING;

  -- QUOTES - March
  INSERT INTO quotes (number, client_id, client_name, title, description, status, total_value, valid_until, payment_method, installment_count, notes, created_at, user_id) VALUES
    ('OR-2503-0001', client_imobiliaria, 'Imobiliária Premier', 'Boxes Apartamentos', '10 boxes refurbish', 'approved', 16500.00, '2025-03-25', 'debit', 2, 'Parceria imob', '2025-03-01T10:00:00', user_uuid),
    ('OR-2503-0002', client_loja, 'Loja Moderna Móveis', 'Vitrines Venda', '4 vitrines vidro 10mm', 'approved', 8500.00, '2025-03-30', 'credit', 3, 'Vitrines expositoras', '2025-03-08T11:00:00', user_uuid),
    ('OR-2503-0003', client_escritorio, 'Escritório Advocacia', 'Divisórias Escritório', 'Divisórias vidro temperado', 'approved', 6500.00, '2025-03-28', 'pix', 1, 'Projeto executivo', '2025-03-12T09:30:00', user_uuid),
    ('OR-2503-0004', client_antonio, 'Antonio Oliveira', 'Porta Vidro Entrada', 'Porta pivotante 10mm', 'expired', 2800.00, '2025-03-20', 'pix', 1, 'Cliente viajou', '2025-03-15T14:00:00', user_uuid),
    ('OR-2503-0005', client_residencial1, 'Edifício Solar Andes', 'Fechamento Sacadas 40 Unid', 'Projeto completo condomínio', 'negotiation', 380000.00, '2025-05-01', 'debit', 6, 'Projeto grande', '2025-03-20T08:00:00', user_uuid)
  ON CONFLICT DO NOTHING;

  -- QUOTES - April
  INSERT INTO quotes (number, client_id, client_name, title, description, status, total_value, valid_until, payment_method, installment_count, notes, created_at, user_id) VALUES
    ('OR-2504-0001', client_residencial2, 'Casa Residencial Green', 'Projeto Casa Completa', 'Janelas, sacadas, boxes, portas', 'approved', 45000.00, '2025-04-30', 'debit', 3, 'Casa alto padrão', '2025-04-02T10:00:00', user_uuid),
    ('OR-2504-0002', client_pedro, 'Pedro Mendes', 'Janelas Apartamento Novo', '8 janelas maxi-ar vidro 6mm', 'approved', 5600.00, '2025-04-20', 'pix', 1, 'Indicação cliente', '2025-04-08T11:30:00', user_uuid),
    ('OR-2504-0003', client_carmen, 'Carmen Souza', 'Espelho Vestidor', 'Espelho 4m x 2.5m', 'approved', 2200.00, '2025-04-25', 'credit', 2, 'Espelho closet', '2025-04-14T09:00:00', user_uuid),
    ('OR-2504-0004', client_joao, 'João Silva', 'Box Banheiro Filhos', 'Box vidro 8mm porta deslizante', 'cancelled', 1650.00, '2025-04-20', 'pix', 1, 'Desistiu', '2025-04-18T15:00:00', user_uuid),
    ('OR-2504-0005', client_restaurante, 'Restaurante Sabor Caseiro', 'Fachada de Vidro', 'Fachada vidro 10mm', 'pending', 18000.00, '2025-05-15', 'debit', 2, 'Aguardando aprovação', '2025-04-25T14:00:00', user_uuid)
  ON CONFLICT DO NOTHING;

  -- QUOTES - May
  INSERT INTO quotes (number, client_id, client_name, title, description, status, total_value, valid_until, payment_method, installment_count, notes, created_at, user_id) VALUES
    ('OR-2505-0001', client_hotel, 'Apart Hotel Premium', 'Ampliação Boxes', 'Mais 10 boxes', 'approved', 18500.00, '2025-05-31', 'debit', 2, 'Segunda fase hotel', '2025-05-03T08:00:00', user_uuid),
    ('OR-2505-0002', client_roberto, 'Roberto Costa', 'Sacada Cobertura', 'Fechamento sacada cobertura', 'approved', 9800.00, '2025-05-28', 'pix', 1, 'Cliente satisfeito', '2025-05-10T10:00:00', user_uuid),
    ('OR-2505-0003', client_fernanda, 'Fernanda Lima', 'Janelas Escritório', '15 janelas vidro laminado', 'approved', 22000.00, '2025-05-30', 'debit', 2, 'Escritório arquitetura', '2025-05-14T11:00:00', user_uuid),
    ('OR-2505-0004', client_abc, 'Construtora ABC Ltda', 'Janelas Prédio Fase 2', '40 janelas alumínio vidro 6mm', 'approved', 36000.00, '2025-06-15', 'debit', 3, 'Continuação contrato', '2025-05-20T09:00:00', user_uuid),
    ('OR-2505-0005', client_escola, 'Escola Viva Learning', 'Divisórias Administrativo', 'Divisórias vidro 10mm', 'expired', 5500.00, '2025-05-25', 'pix', 1, 'Rejeitado', '2025-05-10T08:00:00', user_uuid)
  ON CONFLICT DO NOTHING;

  -- QUOTES - June
  INSERT INTO quotes (number, client_id, client_name, title, description, status, total_value, valid_until, payment_method, installment_count, notes, created_at, user_id) VALUES
    ('OR-2506-0001', client_construtora, 'Construtora XYZ S.A.', 'Janelas Prédio Bloco B', '60 janelas maxi-ar', 'approved', 58000.00, '2025-06-30', 'debit', 3, 'Segunda fase', '2025-06-02T08:00:00', user_uuid),
    ('OR-2506-0002', client_clinica, 'Clínica Saúde Total', 'Ampliação Recepção', 'Fechamento vidro área ampliada', 'pending', 6500.00, '2025-07-10', 'debit', 1, 'Aguardando diretoria', '2025-06-08T10:00:00', user_uuid),
    ('OR-2506-0003', client_maria, 'Maria Santos', 'Box Banheiro Suíte', 'Box vidro 10mm minimalista', 'approved', 2200.00, '2025-06-28', 'pix', 1, 'Segundo box', '2025-06-12T14:00:00', user_uuid),
    ('OR-2506-0004', client_academia, 'Academia Power Fit', 'Ampliação Espelhos', 'Mais 15m lineares', 'negotiation', 6500.00, '2025-07-15', 'debit', 2, 'Expansão academia', '2025-06-18T09:00:00', user_uuid),
    ('OR-2506-0005', client_residencial1, 'Edifício Solar Andes', 'Fechamento Sacadas F1', '10 primeiros apartamentos', 'approved', 95000.00, '2025-07-31', 'debit', 4, 'Aprovado condomínio', '2025-06-22T08:00:00', user_uuid),
    ('OR-2506-0006', client_pedro, 'Pedro Mendes', 'Porta Vidro Escritório', 'Porta pivotante 10mm', 'draft', 2500.00, '2025-07-05', 'pix', 1, 'Em elaboração', '2025-06-25T11:00:00', user_uuid)
  ON CONFLICT DO NOTHING;

  -- WORK ORDERS - January
  INSERT INTO work_orders (number, client_id, category_id, title, description, status, total_value, discount, install_address, install_city, install_date, width, height, area, notes, completed_at, created_at, user_id)
  VALUES ('OS-2501-0001', client_roberto, cat_box, 'Box Banheiro Suite', 'Box vidro 8mm', 'delivered', 1950.00, 0, 'Rua Augusta, 1500', 'São Paulo', '2025-01-15', 1.8, 2.0, 3.6, 'Cliente satisfeito', '2025-01-15', '2025-01-05T10:00:00', user_uuid)
  ON CONFLICT DO NOTHING;

  INSERT INTO work_orders (number, client_id, category_id, title, description, status, total_value, discount, install_address, install_city, install_date, width, height, area, notes, completed_at, created_at, user_id)
  VALUES ('OS-2501-0002', client_fernanda, cat_sacada, 'Fechamento Sacada Penthouse', 'Fechamento 6 módulos vidro 10mm', 'delivered', 15500.00, 500.00, 'Av. Faria Lima, 2000', 'São Paulo', '2025-01-28', 12.0, 2.8, 33.6, 'Projeto premium', '2025-01-28', '2025-01-08T14:30:00', user_uuid)
  ON CONFLICT DO NOTHING;

  -- WORK ORDERS - February
  INSERT INTO work_orders (number, client_id, category_id, title, description, status, total_value, discount, install_address, install_city, install_date, width, height, area, notes, completed_at, created_at, user_id)
  VALUES ('OS-2502-0001', client_construtora, cat_janela, 'Janelas Prédio Bloco A', '80 janelas maxi-ar vidro 6mm', 'delivered', 78000.00, 2000.00, 'Av. Berrini, 550', 'São Paulo', '2025-02-25', NULL, NULL, NULL, 'Contrato grande', '2025-02-25', '2025-02-03T08:00:00', user_uuid)
  ON CONFLICT DO NOTHING;

  INSERT INTO work_orders (number, client_id, category_id, title, description, status, total_value, discount, install_address, install_city, install_date, width, height, area, notes, completed_at, created_at, user_id)
  VALUES ('OS-2502-0002', client_clinica, cat_especial, 'Divisórias Vidro Recepção', 'Divisórias vidro 10mm', 'delivered', 4500.00, 0, 'Rua Estados Unidos, 100', 'São Paulo', '2025-02-20', 4.0, 2.5, 10.0, 'Projeto urgente', '2025-02-20', '2025-02-07T15:00:00', user_uuid)
  ON CONFLICT DO NOTHING;

  INSERT INTO work_orders (number, client_id, category_id, title, description, status, total_value, discount, install_address, install_city, install_date, width, height, area, notes, completed_at, created_at, user_id)
  VALUES ('OS-2502-0003', client_maria, cat_espelho, 'Espelho Banheiro', 'Espelho 4mm com moldura', 'delivered', 380.00, 0, 'Av. Brasil, 456', 'São Paulo', '2025-02-18', 0.8, 1.2, 0.96, 'Serviço rápido', '2025-02-18', '2025-02-12T10:30:00', user_uuid)
  ON CONFLICT DO NOTHING;

  INSERT INTO work_orders (number, client_id, category_id, title, description, status, total_value, discount, install_address, install_city, install_date, width, height, area, notes, completed_at, created_at, user_id)
  VALUES ('OS-2502-0004', client_academia, cat_espelho, 'Espelhos Parede Academia', '30m lineares espelhos 6mm', 'delivered', 12500.00, 0, 'Av. Brasil, 3000', 'São Paulo', '2025-02-28', 30.0, 2.0, 60.0, 'Espelhos instalados', '2025-02-28', '2025-02-22T14:00:00', user_uuid)
  ON CONFLICT DO NOTHING;

  -- WORK ORDERS - March
  INSERT INTO work_orders (number, client_id, category_id, title, description, status, total_value, discount, install_address, install_city, install_date, width, height, area, notes, completed_at, created_at, user_id)
  VALUES ('OS-2503-0001', client_imobiliaria, cat_box, 'Boxes Apartamentos Imobiliária', '10 boxes refurbish', 'delivered', 16500.00, 500.00, 'Rua Oscar Freire, 1000', 'São Paulo', '2025-03-22', NULL, NULL, NULL, 'Parceria imobiliária', '2025-03-22', '2025-03-01T10:00:00', user_uuid)
  ON CONFLICT DO NOTHING;

  INSERT INTO work_orders (number, client_id, category_id, title, description, status, total_value, discount, install_address, install_city, install_date, width, height, area, notes, completed_at, created_at, user_id)
  VALUES ('OS-2503-0002', client_loja, cat_especial, 'Vitrines Loja Moderna', '4 vitrines vidro 10mm', 'delivered', 8500.00, 0, 'Av. Paulista, 2000', 'São Paulo', '2025-03-28', 2.5, 2.5, 6.25, 'Vitrines instaladas', '2025-03-28', '2025-03-08T11:00:00', user_uuid)
  ON CONFLICT DO NOTHING;

  INSERT INTO work_orders (number, client_id, category_id, title, description, status, total_value, discount, install_address, install_city, install_date, width, height, area, notes, completed_at, created_at, user_id)
  VALUES ('OS-2503-0003', client_escritorio, cat_especial, 'Divisórias Escritório Advocacia', 'Divisórias vidro temperado', 'delivered', 6500.00, 0, 'Rua Consolação, 1500', 'São Paulo', '2025-03-25', 5.0, 2.8, 14.0, 'Projeto executivo', '2025-03-25', '2025-03-12T09:30:00', user_uuid)
  ON CONFLICT DO NOTHING;

  INSERT INTO work_orders (number, client_id, category_id, title, description, status, total_value, discount, install_address, install_city, install_date, width, height, area, notes, completed_at, created_at, user_id)
  VALUES ('OS-2503-0004', client_roberto, cat_sacada, 'Fechamento Sacada Cobertura', 'Fechamento 3 módulos', 'delivered', 9800.00, 300.00, 'Rua Augusta, 1500', 'São Paulo', '2025-03-30', 6.0, 2.5, 15.0, 'Retorno cliente', '2025-03-30', '2025-03-15T08:00:00', user_uuid)
  ON CONFLICT DO NOTHING;

  -- WORK ORDERS - April
  INSERT INTO work_orders (number, client_id, category_id, title, description, status, total_value, discount, install_address, install_city, install_date, width, height, area, notes, completed_at, created_at, user_id)
  VALUES ('OS-2504-0001', client_residencial2, cat_especial, 'Projeto Casa Completa Green', 'Janelas, sacadas, boxes, portas', 'in_progress', 45000.00, 2000.00, 'Rua Palmeiras, 300', 'São Paulo', '2025-05-15', NULL, NULL, NULL, 'Em andamento 60%', NULL, '2025-04-02T10:00:00', user_uuid)
  ON CONFLICT DO NOTHING;

  INSERT INTO work_orders (number, client_id, category_id, title, description, status, total_value, discount, install_address, install_city, install_date, width, height, area, notes, completed_at, created_at, user_id)
  VALUES ('OS-2504-0002', client_pedro, cat_janela, 'Janelas Apartamento Novo', '8 janelas maxi-ar vidro 6mm', 'delivered', 5600.00, 0, 'Alameda Santos, 500', 'São Paulo', '2025-04-20', NULL, NULL, NULL, 'Arquiteto satisfeito', '2025-04-20', '2025-04-08T11:30:00', user_uuid)
  ON CONFLICT DO NOTHING;

  INSERT INTO work_orders (number, client_id, category_id, title, description, status, total_value, discount, install_address, install_city, install_date, width, height, area, notes, completed_at, created_at, user_id)
  VALUES ('OS-2504-0003', client_carmen, cat_espelho, 'Espelho Vestidor', 'Espelho 4m x 2.5m', 'delivered', 2200.00, 0, 'Rua Oscar Freire, 222', 'São Paulo', '2025-04-25', 4.0, 2.5, 10.0, 'Espelho closet', '2025-04-25', '2025-04-14T09:00:00', user_uuid)
  ON CONFLICT DO NOTHING;

  -- WORK ORDERS - May
  INSERT INTO work_orders (number, client_id, category_id, title, description, status, total_value, discount, install_address, install_city, install_date, width, height, area, notes, completed_at, created_at, user_id)
  VALUES ('OS-2505-0001', client_hotel, cat_box, 'Ampliação Boxes Hotel', 'Mais 10 boxes', 'delivered', 18500.00, 500.00, 'Av. Paulista, 1000', 'São Paulo', '2025-05-28', NULL, NULL, NULL, 'Segunda fase hotel', '2025-05-28', '2025-05-03T08:00:00', user_uuid)
  ON CONFLICT DO NOTHING;

  INSERT INTO work_orders (number, client_id, category_id, title, description, status, total_value, discount, install_address, install_city, install_date, width, height, area, notes, completed_at, created_at, user_id)
  VALUES ('OS-2505-0002', client_fernanda, cat_janela, 'Janelas Escritório Arquitetura', '15 janelas vidro laminado', 'delivered', 22000.00, 800.00, 'Av. Faria Lima, 2000', 'São Paulo', '2025-05-30', NULL, NULL, NULL, 'Escritório arq', '2025-05-30', '2025-05-14T11:00:00', user_uuid)
  ON CONFLICT DO NOTHING;

  INSERT INTO work_orders (number, client_id, category_id, title, description, status, total_value, discount, install_address, install_city, install_date, width, height, area, notes, created_at, user_id)
  VALUES ('OS-2505-0003', client_abc, cat_janela, 'Janelas Prédio Comercial Fase 2', '40 janelas alumínio vidro 6mm', 'in_progress', 36000.00, 1000.00, 'Rua Industrial, 789', 'São Paulo', '2025-06-30', NULL, NULL, NULL, 'Em andamento 40%', '2025-05-20T09:00:00', user_uuid)
  ON CONFLICT DO NOTHING;

  INSERT INTO work_orders (number, client_id, category_id, title, description, status, total_value, discount, install_address, install_city, install_date, width, height, area, notes, completed_at, created_at, user_id)
  VALUES ('OS-2505-0004', client_maria, cat_box, 'Box Banheiro Suíte Maria', 'Box vidro 10mm minimalista', 'delivered', 2200.00, 0, 'Av. Brasil, 456', 'São Paulo', '2025-05-28', 2.0, 2.2, 4.4, 'Segundo box', '2025-05-28', '2025-05-10T09:00:00', user_uuid)
  ON CONFLICT DO NOTHING;

  -- WORK ORDERS - June (additional)
  INSERT INTO work_orders (number, client_id, category_id, title, description, status, total_value, discount, install_address, install_city, install_date, width, height, area, notes, created_at, user_id)
  VALUES ('OS-2506-0009', client_construtora, cat_janela, 'Janelas Prédio Bloco B', '60 janelas maxi-ar', 'approved', 58000.00, 1500.00, 'Av. Berrini, 550', 'São Paulo', '2025-07-15', NULL, NULL, NULL, 'Segunda fase aprovada', '2025-06-02T08:00:00', user_uuid)
  ON CONFLICT DO NOTHING;

  INSERT INTO work_orders (number, client_id, category_id, title, description, status, total_value, discount, install_address, install_city, install_date, width, height, area, notes, created_at, user_id)
  VALUES ('OS-2506-0010', client_residencial1, cat_sacada, 'Fechamento Sacadas Solar F1', '10 primeiros apartamentos', 'approved', 95000.00, 5000.00, 'Av. Andes, 500', 'São Paulo', '2025-08-01', NULL, NULL, NULL, 'Condomínio aprovado', '2025-06-22T08:00:00', user_uuid)
  ON CONFLICT DO NOTHING;

  -- ACCOUNTS RECEIVABLE - January
  INSERT INTO accounts_receivable (client_id, work_order_id, description, total_amount, received_amount, due_date, receipt_date, status, payment_method, created_at, user_id)
  SELECT client_roberto, id, 'Box Banheiro Suite - OS-2501-0001', 1950.00, 1950.00, '2025-01-15', '2025-01-15', 'received', 'pix', '2025-01-05T10:00:00', user_uuid
  FROM work_orders WHERE number = 'OS-2501-0001' AND user_id = user_uuid LIMIT 1 ON CONFLICT DO NOTHING;

  INSERT INTO accounts_receivable (client_id, work_order_id, description, total_amount, received_amount, due_date, receipt_date, status, payment_method, installment_number, total_installments, created_at, user_id)
  SELECT client_fernanda, id, 'Sacada Penthouse - Parcela 1/2', 7500.00, 7500.00, '2025-01-28', '2025-01-28', 'received', 'debit', 1, 2, '2025-01-08T14:30:00', user_uuid
  FROM work_orders WHERE number = 'OS-2501-0002' AND user_id = user_uuid LIMIT 1 ON CONFLICT DO NOTHING;

  INSERT INTO accounts_receivable (client_id, work_order_id, description, total_amount, received_amount, due_date, receipt_date, status, payment_method, installment_number, total_installments, created_at, user_id)
  SELECT client_fernanda, id, 'Sacada Penthouse - Parcela 2/2', 7500.00, 7500.00, '2025-02-15', '2025-02-15', 'received', 'debit', 2, 2, '2025-01-08T14:30:00', user_uuid
  FROM work_orders WHERE number = 'OS-2501-0002' AND user_id = user_uuid LIMIT 1 ON CONFLICT DO NOTHING;

  -- ACCOUNTS RECEIVABLE - February
  INSERT INTO accounts_receivable (client_id, work_order_id, description, total_amount, received_amount, due_date, receipt_date, status, payment_method, installment_number, total_installments, created_at, user_id)
  SELECT client_construtora, id, 'Janelas Bloco A - Parcela 1/3', 26000.00, 26000.00, '2025-02-25', '2025-02-25', 'received', 'debit', 1, 3, '2025-02-03T08:00:00', user_uuid
  FROM work_orders WHERE number = 'OS-2502-0001' AND user_id = user_uuid LIMIT 1 ON CONFLICT DO NOTHING;

  INSERT INTO accounts_receivable (client_id, work_order_id, description, total_amount, received_amount, due_date, receipt_date, status, payment_method, installment_number, total_installments, created_at, user_id)
  SELECT client_construtora, id, 'Janelas Bloco A - Parcela 2/3', 26000.00, 26000.00, '2025-03-25', '2025-03-25', 'received', 'debit', 2, 3, '2025-02-03T08:00:00', user_uuid
  FROM work_orders WHERE number = 'OS-2502-0001' AND user_id = user_uuid LIMIT 1 ON CONFLICT DO NOTHING;

  INSERT INTO accounts_receivable (client_id, work_order_id, description, total_amount, received_amount, due_date, receipt_date, status, payment_method, installment_number, total_installments, created_at, user_id)
  SELECT client_construtora, id, 'Janelas Bloco A - Parcela 3/3', 26000.00, 26000.00, '2025-04-25', '2025-04-25', 'received', 'debit', 3, 3, '2025-02-03T08:00:00', user_uuid
  FROM work_orders WHERE number = 'OS-2502-0001' AND user_id = user_uuid LIMIT 1 ON CONFLICT DO NOTHING;

  INSERT INTO accounts_receivable (client_id, work_order_id, description, total_amount, received_amount, due_date, receipt_date, status, payment_method, card_fee_percent, created_at, user_id)
  SELECT client_clinica, id, 'Divisórias Recepção - OS-2502-0002', 4500.00, 4500.00, '2025-02-20', '2025-02-20', 'received', 'credit', 3.5, '2025-02-07T15:00:00', user_uuid
  FROM work_orders WHERE number = 'OS-2502-0002' AND user_id = user_uuid LIMIT 1 ON CONFLICT DO NOTHING;

  INSERT INTO accounts_receivable (client_id, work_order_id, description, total_amount, received_amount, due_date, receipt_date, status, payment_method, created_at, user_id)
  SELECT client_maria, id, 'Espelho Banheiro - OS-2502-0003', 380.00, 380.00, '2025-02-18', '2025-02-18', 'received', 'pix', '2025-02-12T10:30:00', user_uuid
  FROM work_orders WHERE number = 'OS-2502-0003' AND user_id = user_uuid LIMIT 1 ON CONFLICT DO NOTHING;

  INSERT INTO accounts_receivable (client_id, work_order_id, description, total_amount, received_amount, due_date, receipt_date, status, payment_method, installment_number, total_installments, created_at, user_id)
  SELECT client_academia, id, 'Espelhos Academia - Parcela 1/2', 6250.00, 6250.00, '2025-02-28', '2025-02-28', 'received', 'debit', 1, 2, '2025-02-22T14:00:00', user_uuid
  FROM work_orders WHERE number = 'OS-2502-0004' AND user_id = user_uuid LIMIT 1 ON CONFLICT DO NOTHING;

  INSERT INTO accounts_receivable (client_id, work_order_id, description, total_amount, received_amount, due_date, receipt_date, status, payment_method, installment_number, total_installments, created_at, user_id)
  SELECT client_academia, id, 'Espelhos Academia - Parcela 2/2', 6250.00, 6250.00, '2025-03-15', '2025-03-15', 'received', 'debit', 2, 2, '2025-02-22T14:00:00', user_uuid
  FROM work_orders WHERE number = 'OS-2502-0004' AND user_id = user_uuid LIMIT 1 ON CONFLICT DO NOTHING;

  -- ACCOUNTS RECEIVABLE - March
  INSERT INTO accounts_receivable (client_id, work_order_id, description, total_amount, received_amount, due_date, receipt_date, status, payment_method, installment_number, total_installments, created_at, user_id)
  SELECT client_imobiliaria, id, 'Boxes Apartamentos - Parcela 1/2', 8000.00, 8000.00, '2025-03-22', '2025-03-22', 'received', 'debit', 1, 2, '2025-03-01T10:00:00', user_uuid
  FROM work_orders WHERE number = 'OS-2503-0001' AND user_id = user_uuid LIMIT 1 ON CONFLICT DO NOTHING;

  INSERT INTO accounts_receivable (client_id, work_order_id, description, total_amount, received_amount, due_date, receipt_date, status, payment_method, installment_number, total_installments, created_at, user_id)
  SELECT client_imobiliaria, id, 'Boxes Apartamentos - Parcela 2/2', 8000.00, 8000.00, '2025-04-10', '2025-04-10', 'received', 'debit', 2, 2, '2025-03-01T10:00:00', user_uuid
  FROM work_orders WHERE number = 'OS-2503-0001' AND user_id = user_uuid LIMIT 1 ON CONFLICT DO NOTHING;

  INSERT INTO accounts_receivable (client_id, work_order_id, description, total_amount, received_amount, due_date, receipt_date, status, payment_method, created_at, user_id)
  SELECT client_escritorio, id, 'Divisórias Advocacia - OS-2503-0003', 6500.00, 6500.00, '2025-03-25', '2025-03-25', 'received', 'pix', '2025-03-12T09:30:00', user_uuid
  FROM work_orders WHERE number = 'OS-2503-0003' AND user_id = user_uuid LIMIT 1 ON CONFLICT DO NOTHING;

  INSERT INTO accounts_receivable (client_id, work_order_id, description, total_amount, received_amount, due_date, receipt_date, status, payment_method, created_at, user_id)
  SELECT client_roberto, id, 'Sacada Cobertura - OS-2503-0004', 9500.00, 9500.00, '2025-03-30', '2025-03-30', 'received', 'pix', '2025-03-15T08:00:00', user_uuid
  FROM work_orders WHERE number = 'OS-2503-0004' AND user_id = user_uuid LIMIT 1 ON CONFLICT DO NOTHING;

  -- ACCOUNTS RECEIVABLE - April
  INSERT INTO accounts_receivable (client_id, work_order_id, description, total_amount, received_amount, due_date, receipt_date, status, payment_method, installment_number, total_installments, created_at, user_id)
  SELECT client_residencial2, id, 'Casa Green - Parcela 1/3', 15000.00, 15000.00, '2025-04-15', '2025-04-15', 'received', 'debit', 1, 3, '2025-04-02T10:00:00', user_uuid
  FROM work_orders WHERE number = 'OS-2504-0001' AND user_id = user_uuid LIMIT 1 ON CONFLICT DO NOTHING;

  INSERT INTO accounts_receivable (client_id, work_order_id, description, total_amount, received_amount, due_date, status, payment_method, installment_number, total_installments, created_at, user_id)
  SELECT client_residencial2, id, 'Casa Green - Parcela 2/3', 14000.00, 0, '2025-05-15', 'pending', 'debit', 2, 3, '2025-04-02T10:00:00', user_uuid
  FROM work_orders WHERE number = 'OS-2504-0001' AND user_id = user_uuid LIMIT 1 ON CONFLICT DO NOTHING;

  INSERT INTO accounts_receivable (client_id, work_order_id, description, total_amount, received_amount, due_date, receipt_date, status, payment_method, created_at, user_id)
  SELECT client_pedro, id, 'Janelas Apartamento Novo - OS-2504-0002', 5600.00, 5600.00, '2025-04-20', '2025-04-20', 'received', 'pix', '2025-04-08T11:30:00', user_uuid
  FROM work_orders WHERE number = 'OS-2504-0002' AND user_id = user_uuid LIMIT 1 ON CONFLICT DO NOTHING;

  -- ACCOUNTS RECEIVABLE - May
  INSERT INTO accounts_receivable (client_id, work_order_id, description, total_amount, received_amount, due_date, receipt_date, status, payment_method, installment_number, total_installments, created_at, user_id)
  SELECT client_hotel, id, 'Ampliação Boxes Hotel - Parcela 1/2', 9000.00, 9000.00, '2025-05-28', '2025-05-28', 'received', 'debit', 1, 2, '2025-05-03T08:00:00', user_uuid
  FROM work_orders WHERE number = 'OS-2505-0001' AND user_id = user_uuid LIMIT 1 ON CONFLICT DO NOTHING;

  INSERT INTO accounts_receivable (client_id, work_order_id, description, total_amount, received_amount, due_date, receipt_date, status, payment_method, installment_number, total_installments, created_at, user_id)
  SELECT client_hotel, id, 'Ampliação Boxes Hotel - Parcela 2/2', 9000.00, 9000.00, '2025-06-15', '2025-06-15', 'received', 'debit', 2, 2, '2025-05-03T08:00:00', user_uuid
  FROM work_orders WHERE number = 'OS-2505-0001' AND user_id = user_uuid LIMIT 1 ON CONFLICT DO NOTHING;

  INSERT INTO accounts_receivable (client_id, work_order_id, description, total_amount, received_amount, due_date, receipt_date, status, payment_method, installment_number, total_installments, created_at, user_id)
  SELECT client_fernanda, id, 'Janelas Escritório Arq - Parcela 1/2', 10600.00, 10600.00, '2025-05-30', '2025-05-30', 'received', 'debit', 1, 2, '2025-05-14T11:00:00', user_uuid
  FROM work_orders WHERE number = 'OS-2505-0002' AND user_id = user_uuid LIMIT 1 ON CONFLICT DO NOTHING;

  INSERT INTO accounts_receivable (client_id, work_order_id, description, total_amount, received_amount, due_date, receipt_date, status, payment_method, installment_number, total_installments, created_at, user_id)
  SELECT client_fernanda, id, 'Janelas Escritório Arq - Parcela 2/2', 10600.00, 10600.00, '2025-06-30', '2025-06-30', 'received', 'debit', 2, 2, '2025-05-14T11:00:00', user_uuid
  FROM work_orders WHERE number = 'OS-2505-0002' AND user_id = user_uuid LIMIT 1 ON CONFLICT DO NOTHING;

  INSERT INTO accounts_receivable (client_id, work_order_id, description, total_amount, received_amount, due_date, status, payment_method, installment_number, total_installments, created_at, user_id)
  SELECT client_abc, id, 'Janelas Fase 2 - Parcela 1/3', 11667.00, 0, '2025-06-15', 'pending', 'debit', 1, 3, '2025-05-20T09:00:00', user_uuid
  FROM work_orders WHERE number = 'OS-2505-0003' AND user_id = user_uuid LIMIT 1 ON CONFLICT DO NOTHING;

  INSERT INTO accounts_receivable (client_id, work_order_id, description, total_amount, received_amount, due_date, receipt_date, status, payment_method, created_at, user_id)
  SELECT client_maria, id, 'Box Banheiro Suíte - OS-2505-0004', 2200.00, 2200.00, '2025-05-28', '2025-05-28', 'received', 'pix', '2025-05-10T09:00:00', user_uuid
  FROM work_orders WHERE number = 'OS-2505-0004' AND user_id = user_uuid LIMIT 1 ON CONFLICT DO NOTHING;

  -- ACCOUNTS RECEIVABLE - June
  INSERT INTO accounts_receivable (client_id, work_order_id, description, total_amount, received_amount, due_date, status, payment_method, installment_number, total_installments, created_at, user_id)
  SELECT client_construtora, id, 'Janelas Bloco B - Parcela 1/3', 19333.33, 0, '2025-07-15', 'pending', 'debit', 1, 3, '2025-06-02T08:00:00', user_uuid
  FROM work_orders WHERE number = 'OS-2506-0009' AND user_id = user_uuid LIMIT 1 ON CONFLICT DO NOTHING;

  INSERT INTO accounts_receivable (client_id, work_order_id, description, total_amount, received_amount, due_date, status, payment_method, installment_number, total_installments, created_at, user_id)
  SELECT client_residencial1, id, 'Condomínio Solar Andes - F1 Parcela 1/4', 22500.00, 0, '2025-08-01', 'pending', 'debit', 1, 4, '2025-06-22T08:00:00', user_uuid
  FROM work_orders WHERE number = 'OS-2506-0010' AND user_id = user_uuid LIMIT 1 ON CONFLICT DO NOTHING;

  -- ACCOUNTS PAYABLE - January to June
  INSERT INTO accounts_payable (supplier_id, description, category, subcategory, total_amount, paid_amount, due_date, payment_date, status, payment_method, document_number, created_at, user_id) VALUES
    (supplier_vidro, 'Vidro 8mm e 10mm - Janeiro', 'variable', 'Vidro', 4500.00, 4500.00, '2025-01-10', '2025-01-10', 'paid', 'debit', 'NF-2025-001', '2025-01-05T10:00:00', user_uuid),
    (supplier_aluminio, 'Perfis alumínio diversos - Janeiro', 'variable', 'Alumínio', 2200.00, 2200.00, '2025-01-12', '2025-01-12', 'paid', 'debit', 'NF-2025-005', '2025-01-08T10:00:00', user_uuid),
    (NULL, 'Aluguel Galpão - Janeiro', 'fixed', 'Aluguel', 3500.00, 3500.00, '2025-01-10', '2025-01-10', 'paid', 'debit', NULL, '2025-01-01T08:00:00', user_uuid),
    (NULL, 'Energia Elétrica - Janeiro', 'fixed', 'Energia', 780.40, 780.40, '2025-01-15', '2025-01-15', 'paid', 'pix', NULL, '2025-01-10T08:00:00', user_uuid),
    (NULL, 'Internet - Janeiro', 'fixed', 'Internet', 189.90, 189.90, '2025-01-20', '2025-01-20', 'paid', 'pix', NULL, '2025-01-15T08:00:00', user_uuid),
    (supplier_vidro, 'Vidro laminado 6mm - Fevereiro', 'variable', 'Vidro', 12800.00, 12800.00, '2025-02-08', '2025-02-08', 'paid', 'debit', 'NF-2025-018', '2025-02-03T08:00:00', user_uuid),
    (supplier_vidro, 'Vidro espelho 6mm - Fevereiro', 'variable', 'Vidro', 5500.00, 5500.00, '2025-02-10', '2025-02-10', 'paid', 'debit', 'NF-2025-022', '2025-02-05T08:00:00', user_uuid),
    (supplier_aluminio, 'Perfis janelas maxi-ar', 'variable', 'Alumínio', 4800.00, 4800.00, '2025-02-12', '2025-02-12', 'paid', 'debit', 'NF-2025-025', '2025-02-08T08:00:00', user_uuid),
    (supplier_ferragens, 'Ferragens projetos fevereiro', 'variable', 'Ferragens', 3200.00, 3200.00, '2025-02-15', '2025-02-15', 'paid', 'debit', 'NF-2025-030', '2025-02-10T08:00:00', user_uuid),
    (NULL, 'Aluguel Galpão - Fevereiro', 'fixed', 'Aluguel', 3500.00, 3500.00, '2025-02-10', '2025-02-10', 'paid', 'debit', NULL, '2025-02-01T08:00:00', user_uuid),
    (NULL, 'Energia Elétrica - Fevereiro', 'fixed', 'Energia', 845.80, 845.80, '2025-02-15', '2025-02-15', 'paid', 'pix', NULL, '2025-02-10T08:00:00', user_uuid),
    (NULL, 'Internet - Fevereiro', 'fixed', 'Internet', 189.90, 189.90, '2025-02-20', '2025-02-20', 'paid', 'pix', NULL, '2025-02-15T08:00:00', user_uuid),
    (supplier_vidro, 'Vidro temperado 10mm - Março', 'variable', 'Vidro', 8500.00, 8500.00, '2025-03-08', '2025-03-08', 'paid', 'debit', 'NF-2025-035', '2025-03-03T08:00:00', user_uuid),
    (supplier_vidro2, 'Vidro temperado estoque', 'variable', 'Vidro', 3800.00, 3800.00, '2025-03-10', '2025-03-10', 'paid', 'debit', 'NF-2025-038', '2025-03-05T08:00:00', user_uuid),
    (supplier_aluminio, 'Perfis boxes apartamentos', 'variable', 'Alumínio', 4200.00, 4200.00, '2025-03-12', '2025-03-12', 'paid', 'debit', 'NF-2025-040', '2025-03-08T08:00:00', user_uuid),
    (NULL, 'Aluguel Galpão - Março', 'fixed', 'Aluguel', 3500.00, 3500.00, '2025-03-10', '2025-03-10', 'paid', 'debit', NULL, '2025-03-01T08:00:00', user_uuid),
    (NULL, 'Energia Elétrica - Março', 'fixed', 'Energia', 765.30, 765.30, '2025-03-15', '2025-03-15', 'paid', 'pix', NULL, '2025-03-10T08:00:00', user_uuid),
    (NULL, 'Internet - Março', 'fixed', 'Internet', 189.90, 189.90, '2025-03-20', '2025-03-20', 'paid', 'pix', NULL, '2025-03-15T08:00:00', user_uuid),
    (supplier_vidro, 'Vidro 8mm e 10mm casa Green', 'variable', 'Vidro', 15000.00, 15000.00, '2025-04-05', '2025-04-05', 'paid', 'debit', 'NF-2025-050', '2025-04-01T08:00:00', user_uuid),
    (supplier_vidro, 'Vidro 6mm janelas projeto', 'variable', 'Vidro', 6500.00, 6500.00, '2025-04-08', '2025-04-08', 'paid', 'debit', 'NF-2025-052', '2025-04-03T08:00:00', user_uuid),
    (supplier_aluminio, 'Perfis projeto casa Green', 'variable', 'Alumínio', 8500.00, 8500.00, '2025-04-10', '2025-04-10', 'paid', 'debit', 'NF-2025-055', '2025-04-05T08:00:00', user_uuid),
    (supplier_ferragens, 'Ferragens completas abril', 'variable', 'Ferragens', 4800.00, 4800.00, '2025-04-12', '2025-04-12', 'paid', 'debit', 'NF-2025-058', '2025-04-08T08:00:00', user_uuid),
    (NULL, 'Aluguel Galpão - Abril', 'fixed', 'Aluguel', 3500.00, 3500.00, '2025-04-10', '2025-04-10', 'paid', 'debit', NULL, '2025-04-01T08:00:00', user_uuid),
    (NULL, 'Energia Elétrica - Abril', 'fixed', 'Energia', 812.60, 812.60, '2025-04-15', '2025-04-15', 'paid', 'pix', NULL, '2025-04-10T08:00:00', user_uuid),
    (NULL, 'Internet - Abril', 'fixed', 'Internet', 189.90, 189.90, '2025-04-20', '2025-04-20', 'paid', 'pix', NULL, '2025-04-15T08:00:00', user_uuid),
    (supplier_vidro, 'Vidro para boxes hotel', 'variable', 'Vidro', 5500.00, 5500.00, '2025-05-05', '2025-05-05', 'paid', 'debit', 'NF-2025-065', '2025-05-01T08:00:00', user_uuid),
    (supplier_vidro, 'Vidro laminado escritório arq', 'variable', 'Vidro', 4200.00, 4200.00, '2025-05-08', '2025-05-08', 'paid', 'debit', 'NF-2025-068', '2025-05-03T08:00:00', user_uuid),
    (supplier_aluminio, 'Perfis maio diversas', 'variable', 'Alumínio', 3800.00, 3800.00, '2025-05-10', '2025-05-10', 'paid', 'debit', 'NF-2025-070', '2025-05-05T08:00:00', user_uuid),
    (NULL, 'Aluguel Galpão - Maio', 'fixed', 'Aluguel', 3500.00, 3500.00, '2025-05-10', '2025-05-10', 'paid', 'debit', NULL, '2025-05-01T08:00:00', user_uuid),
    (NULL, 'Energia Elétrica - Maio', 'fixed', 'Energia', 756.90, 756.90, '2025-05-15', '2025-05-15', 'paid', 'pix', NULL, '2025-05-10T08:00:00', user_uuid),
    (NULL, 'Internet - Maio', 'fixed', 'Internet', 189.90, 189.90, '2025-05-20', '2025-05-20', 'paid', 'pix', NULL, '2025-05-15T08:00:00', user_uuid),
    (supplier_vidro, 'Vidro projeto condomínio Solar', 'variable', 'Vidro', 22000.00, 11000.00, '2025-06-10', '2025-06-10', 'partial', 'debit', 'NF-2025-080', '2025-06-05T08:00:00', user_uuid),
    (supplier_vidro, 'Vidro temperado janelas bloco B', 'variable', 'Vidro', 8500.00, 0, '2025-06-25', NULL, 'pending', 'debit', 'NF-2025-085', '2025-06-20T08:00:00', user_uuid),
    (NULL, 'Aluguel Galpão - Junho', 'fixed', 'Aluguel', 3500.00, 3500.00, '2025-06-10', '2025-06-10', 'paid', 'debit', NULL, '2025-06-01T08:00:00', user_uuid),
    (NULL, 'Energia Elétrica - Junho', 'fixed', 'Energia', 890.50, 890.50, '2025-06-15', '2025-06-15', 'paid', 'pix', NULL, '2025-06-10T08:00:00', user_uuid),
    (NULL, 'Internet - Junho', 'fixed', 'Internet', 189.90, 189.90, '2025-06-20', '2025-06-20', 'paid', 'pix', NULL, '2025-06-15T08:00:00', user_uuid)
  ON CONFLICT DO NOTHING;

  -- Provisions
  INSERT INTO accounts_payable (description, category, subcategory, total_amount, paid_amount, due_date, status, created_at, user_id) VALUES
    ('Reserva 13º Salário - Jan', 'provision', 'Décimo Terceiro', 2500.00, 0, '2025-11-30', 'pending', '2025-01-15T08:00:00', user_uuid),
    ('Reserva Férias - Jan', 'provision', 'Férias', 1200.00, 0, '2025-12-15', 'pending', '2025-01-15T08:00:00', user_uuid),
    ('Reserva 13º Salário - Fev', 'provision', 'Décimo Terceiro', 2500.00, 0, '2025-11-30', 'pending', '2025-02-15T08:00:00', user_uuid),
    ('Reserva Férias - Fev', 'provision', 'Férias', 1200.00, 0, '2025-12-15', 'pending', '2025-02-15T08:00:00', user_uuid),
    ('Reserva 13º Salário - Mar', 'provision', 'Décimo Terceiro', 2500.00, 0, '2025-11-30', 'pending', '2025-03-15T08:00:00', user_uuid),
    ('Reserva Férias - Mar', 'provision', 'Férias', 1200.00, 0, '2025-12-15', 'pending', '2025-03-15T08:00:00', user_uuid),
    ('Reserva 13º Salário - Abr', 'provision', 'Décimo Terceiro', 2500.00, 0, '2025-11-30', 'pending', '2025-04-15T08:00:00', user_uuid),
    ('Reserva Férias - Abr', 'provision', 'Férias', 1200.00, 0, '2025-12-15', 'pending', '2025-04-15T08:00:00', user_uuid),
    ('Reserva 13º Salário - Mai', 'provision', 'Décimo Terceiro', 2500.00, 0, '2025-11-30', 'pending', '2025-05-15T08:00:00', user_uuid),
    ('Reserva Férias - Mai', 'provision', 'Férias', 1200.00, 0, '2025-12-15', 'pending', '2025-05-15T08:00:00', user_uuid)
  ON CONFLICT DO NOTHING;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

SELECT seed_extended_data((SELECT id FROM auth.users LIMIT 1));
DROP FUNCTION IF EXISTS seed_extended_data(UUID);