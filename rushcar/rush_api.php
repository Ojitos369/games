<?php
/**
 * API para Rush Hour Pro - Ojitos
 * Gestiona niveles (2M+), récords mundiales y ranking de leyendas.
 */

// Encabezados para permitir peticiones desde el juego (CORS)
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, POST");
header("Content-Type: application/json; charset=UTF-8");

// --- CONFIGURACIÓN DE BASE DE DATOS ---
$host = "31.97.208.97"; 
$db   = "u345534273_rush_db";
$user = "u345534273_rush_db";
$pass = "Rus4_db$";

try {
    $pdo = new PDO("mysql:host=$host;dbname=$db;charset=utf8", $user, $pass);
    // Modo de error para desarrollo, lanzará excepciones si algo falla
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $action = $_GET['action'] ?? '';

    switch($action) {
        
        /**
         * Obtiene un nivel por UUID, ID o Dificultad (Óptimo)
         */
        case 'get_level':
            $uuid = $_GET['uuid'] ?? null;
            $id = $_GET['id'] ?? null;
            $optimo = $_GET['optimo'] ?? null;
            
            if ($uuid) {
                // Buscar por UUID específico
                $stmt = $pdo->prepare("SELECT * FROM niveles WHERE uuid = ?");
                $stmt->execute([$uuid]);
            } elseif ($id) {
                // Buscar por ID numérico
                $stmt = $pdo->prepare("SELECT * FROM niveles WHERE id = ?");
                $stmt->execute([(int)$id]);
            } elseif ($optimo) {
                // Filtrar por dificultad (movimientos óptimos)
                // Se elige uno al azar dentro de ese subconjunto
                $stmt = $pdo->prepare("SELECT * FROM niveles WHERE optimo = ? ORDER BY RAND() LIMIT 1");
                $stmt->execute([(int)$optimo]);
            } else {
                // Selecciona primero un nivel al azar entre 10 y 60
                $randomOptimo = rand(10, 60);
                $stmt = $pdo->prepare("SELECT * FROM niveles WHERE optimo = ? ORDER BY RAND() LIMIT 1");
                $stmt->execute([$randomOptimo]);
                
                // Fallback: Si no hay niveles con ese óptimo (raro), aleatorio total
                if ($stmt->rowCount() == 0) {
                    $stmtMax = $pdo->query("SELECT MAX(id) as max_id FROM niveles");
                    $maxId = $stmtMax->fetch(PDO::FETCH_ASSOC)['max_id'];
                    $randomId = rand(1, $maxId);
                    $stmt = $pdo->prepare("SELECT * FROM niveles WHERE id = ?");
                    $stmt->execute([$randomId]);
                }
            }
            
            $nivel = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($nivel) {
                // Registrar que el nivel fue cargado
                $pdo->prepare("UPDATE niveles SET plays_count = plays_count + 1, last_played = NOW() WHERE id = ?")
                    ->execute([$nivel['id']]);
                echo json_encode($nivel);
            } else {
                echo json_encode(["error" => "Nivel no encontrado con los criterios dados."]);
            }
            break;

        /**
         * Guarda el récord de un jugador al completar un nivel
         */
        case 'save_record':
            $data = json_decode(file_get_contents("php://input"), true);
            $username = strtolower(trim($data['username'] ?? ''));
            $levelId = (int)($data['level_id'] ?? 0);
            $moves = (int)($data['moves'] ?? 0);
            $seconds = (int)($data['seconds'] ?? 0);

            if (empty($username) || $levelId <= 0) {
                die(json_encode(["error" => "Datos de guardado inválidos."]));
            }

            // Asegurar que el usuario existe en la tabla
            $stmtUser = $pdo->prepare("INSERT INTO usuarios (username) VALUES (?) ON DUPLICATE KEY UPDATE last_login = NOW()");
            $stmtUser->execute([$username]);
            $userId = $pdo->query("SELECT id FROM usuarios WHERE username = '$username'")->fetchColumn();

            // Insertar el nuevo récord
            $stmtRec = $pdo->prepare("INSERT INTO records (nivel_id, user_id, moves, time_seconds) VALUES (?, ?, ?, ?)");
            $stmtRec->execute([$levelId, $userId, $moves, $seconds]);
            
            echo json_encode(["status" => "success"]);
            break;

        /**
         * Obtiene el Top 10 de un nivel específico
         */
        case 'get_records':
            $lid = (int)($_GET['level_id'] ?? 0);
            if ($lid <= 0) die(json_encode(["error" => "ID de nivel requerido."]));

            // Solo mostrar 1 vez por usuario, el puntaje mayor (mejor)
            // Criterio: 1. Movimientos, 2. Tiempo
            $stmt = $pdo->prepare("
                SELECT u.username, MIN(r.moves) as moves, MIN(r.time_seconds) as time_seconds, MAX(r.timestamp) as timestamp 
                FROM records r 
                JOIN usuarios u ON r.user_id = u.id 
                WHERE r.nivel_id = ? 
                GROUP BY u.id
                ORDER BY moves ASC, time_seconds ASC 
                LIMIT 10
            ");
            $stmt->execute([$lid]);
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode(["world" => $results]);
            break;

        /**
         * Obtiene los records de un usuario específico
         */
        case 'get_user_records':
            $username = strtolower(trim($_GET['username'] ?? ''));
            if (empty($username)) die(json_encode(["error" => "Username requerido."]));

            $stmt = $pdo->prepare("
                SELECT r.nivel_id, n.optimo, r.moves, r.time_seconds, r.timestamp 
                FROM records r
                JOIN usuarios u ON r.user_id = u.id
                JOIN niveles n ON r.nivel_id = n.id
                WHERE u.username = ?
                ORDER BY r.timestamp DESC
                LIMIT 50
            ");
            $stmt->execute([$username]);
            echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
            break;

        /**
         * Ranking de jugadores con más niveles resueltos (Leyendas)
         */
        case 'get_top_players':
            $stmt = $pdo->query("
                SELECT u.username, COUNT(r.id) as total 
                FROM records r 
                JOIN usuarios u ON r.user_id = u.id 
                GROUP BY u.id 
                ORDER BY total DESC 
                LIMIT 10
            ");
            echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
            break;

        /**
         * Niveles más populares (Tendencia)
         */
        case 'get_trending':
            // 10 más populares
            $stmtPop = $pdo->query("
                SELECT uuid, id, optimo, plays_count 
                FROM niveles 
                ORDER BY plays_count DESC 
                LIMIT 10
            ");
            $popular = $stmtPop->fetchAll(PDO::FETCH_ASSOC);

            // 10 últimos jugados
            $stmtLast = $pdo->query("
                SELECT uuid, id, optimo, plays_count, last_played
                FROM niveles 
                WHERE last_played IS NOT NULL
                ORDER BY last_played DESC 
                LIMIT 10
            ");
            $recent = $stmtLast->fetchAll(PDO::FETCH_ASSOC);

            echo json_encode(["popular" => $popular, "recent" => $recent]);
            break;

        default:
            echo json_encode(["error" => "Acción '" . $action . "' no reconocida."]);
    }

} catch (PDOException $e) {
    // Error crítico de base de datos
    http_response_code(500);
    echo json_encode(["error" => "Error de SQL: " . $e->getMessage()]);
}
?>