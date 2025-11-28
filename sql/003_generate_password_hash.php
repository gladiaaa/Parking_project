<?php
/**
 * Script pour générer les hash de mots de passe
 * 
 * Usage: php sql/003_generate_password_hash.php
 * 
 * Ce script génère les hash bcrypt pour les mots de passe de test
 * et affiche les commandes SQL à exécuter.
 */

$password = 'password123';

echo "=== Génération des hash de mots de passe ===\n\n";

$hash = password_hash($password, PASSWORD_BCRYPT);

echo "Mot de passe: {$password}\n";
echo "Hash généré: {$hash}\n\n";

echo "=== Commandes SQL à exécuter ===\n\n";

echo "-- Mettre à jour les utilisateurs existants\n";
echo "UPDATE users SET password_hash = '{$hash}' WHERE email = 'user@example.com';\n";
echo "UPDATE users SET password_hash = '{$hash}' WHERE email = 'owner@example.com';\n\n";

echo "-- Ou insérer de nouveaux utilisateurs\n";
echo "INSERT INTO users (email, password_hash, firstname, lastname, role, type_abonnement) VALUES\n";
echo "('user@example.com', '{$hash}', 'Jean', 'Dupont', 'user', 'gratuit'),\n";
echo "('owner@example.com', '{$hash}', 'Marie', 'Martin', 'owner', 'premium')\n";
echo "ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash);\n\n";

echo "=== Vérification ===\n\n";
echo "Pour vérifier que le hash fonctionne:\n";
echo "php -r \"var_dump(password_verify('password123', '{$hash}'));\"\n";
echo "Devrait afficher: bool(true)\n";

