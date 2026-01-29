-- Clean up existing stages (be careful with existing leads)
-- Strategy: We will create the 3 standard stages if they don't exist, and update them.
-- If you have leads in other stages, you might want to migrate them manually or use a script.

-- 1. Ensure "Novo Lead" exists
INSERT INTO lead_pipeline_stages (name, order_index, is_final, is_won, color)
VALUES ('Novo Lead', 0, false, false, 'blue')
ON CONFLICT (name) DO UPDATE
SET order_index = 0, is_final = false, is_won = false, color = 'blue';

-- 2. Ensure "Em andamento" exists
INSERT INTO lead_pipeline_stages (name, order_index, is_final, is_won, color)
VALUES ('Em andamento', 1, false, false, 'yellow')
ON CONFLICT (name) DO UPDATE
SET order_index = 1, is_final = false, is_won = false, color = 'yellow';

-- 3. Ensure "Concluido" exists
INSERT INTO lead_pipeline_stages (name, order_index, is_final, is_won, color)
VALUES ('Concluido', 2, true, true, 'green')
ON CONFLICT (name) DO UPDATE
SET order_index = 2, is_final = true, is_won = true, color = 'green';

-- Optional: Delete other stages that are NOT these 3 (Uncomment if you want to enforce ONLY these 3)
-- DELETE FROM lead_pipeline_stages WHERE name NOT IN ('Novo Lead', 'Em andamento', 'Concluido');
