insert into countries (code, name, demonym, default_language, supported_languages, currency_code, active)
values ('US', 'United States Community Network', 'United States', 'en', '["en","fr"]', 'USD', true)
on conflict (code) do nothing;
