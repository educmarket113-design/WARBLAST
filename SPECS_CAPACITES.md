# WARBLAST — Spécifications officielles des capacités

Statut : une capacité est « validée » seulement après confirmation d'Alou. Ne pas la modifier sans son accord.

## EAU (fruit bleu) — spécification officielle
Famille : contrôle / repoussement. Commune aux 5 niveaux : 5 utilisations, recharge indépendante, direction donnée par le stick d'attaque, déclenchement automatique au relâchement, vrais dégâts, vraie poussée, collisions avec les murs.

| Niv. | Apparence | Animation | Comportement | Effets |
|---|---|---|---|---|
| 1 | Une vague d'eau bleue à crête blanche | Elle avance en s'élargissant puis s'estompe | Une vague dans la direction visée | Dégâts 17, poussée modérée, touche chaque ennemi une fois |
| 2 | Deux vagues | La deuxième part dès que la première est finie, sans nouvelle action | Deux vagues successives, la 2e plus longue et plus large | Dégâts 2 x 20, la 2e pousse plus loin |
| 3 | Trois vagues | Enchaînement automatique des 3 vagues | Trois vagues successives, la 3e la plus puissante | Dégâts 3 x 23, la 3e pousse le plus fort (x1,25) |
| 4 | Une main d'eau géante sort du sol sous UN seul adversaire ciblé (le plus proche dans la direction visée, portée 340 px) | Montée, fermeture des doigts, soulèvement (58 px), lancer, puis la main s'enfonce et disparaît | Attrape exactement un ennemi, l'étourdit, le projette loin (poussée 2600) | Dégâts 80, étourdissement ~1 s |
| 5 | Rayon d'action visible autour du joueur (260 px) et plusieurs mains d'eau | Toutes les mains sortent en même temps, attrapent, soulèvent, lancent, s'estompent | Chaque ennemi dans le rayon (10 max) est attrapé par sa propre main | Dégâts 55 par ennemi, étourdissement, projection |

Notes techniques : code dans `evolve.js` (bloc EAU), fx `tide`, liste `G.hands`, `WB.updateHands`, `WB.drawHands`. Le silence de l'ancienne version a été retiré (hors spécification). Aucune couche réseau n'existe dans le jeu : la synchronisation multijoueur n'a pas pu être testée.

## FEU (fruit piment) — spécification officielle
Commune : 5 utilisations, brûlure avec fumée noire et dégâts continus jusqu'à l'extinction, appui direct = ciblage automatique de l'adversaire le plus proche.

| Niv. | Apparence | Comportement | Effets |
|---|---|---|---|
| 1 | Une boule de feu (flammes jaunes, orange, rouges) | Une boule vers la cible | Dégâts 13 + brûlure |
| 2 | Deux boules de feu | Lancées ensemble, légèrement écartées | 2 x 16 + brûlure |
| 3 | Rayon de feu continu | 1,1 s, trajectoire fixée au tir, portée 340 px | 5 par impulsion (0,1 s) + brûlure |
| 4 | Deux rayons de feu | 1,3 s, deux trajectoires voisines | 5 par impulsion et par rayon + brûlure |
| 5 | Lance-flammes : masse de flammes en continu | 2,4 s, portée 390 px, cône large, suit doucement l'ennemi le plus proche, touche plusieurs cibles | 6 par impulsion (0,12 s) + brûlure ; laisse des flammes au sol (3,6 s) qui infligent 2 + petite brûlure toutes les 0,3 s |

Un seul jet de feu à la fois par lanceur (pas de charge perdue pendant un jet).

## APPUI DIRECT
Un appui sur une capacité de l'analogue (ou sur l'analogue) la déclenche aussitôt sur l'adversaire le plus proche, sans bouger l'analogue. Sans adversaire à portée : rien n'est consommé (sauf bouclier et invisibilité, utilisables sans cible). Pousser l'analogue reste possible pour viser à la main.

## FUSION (niveau 7 et plus)
- Bouton FUSIONNER (au-dessus de l'analogue) si au moins 2 capacités y sont placées ; DÉFUSIONNER pour les séparer. Capacités non modifiables pendant la fusion.
- Un seul disque de fusion : niveau commun = moyenne des niveaux arrondie au supérieur (max 5), plus de niveaux indépendants.
- Un tir fusionné consomme 1 charge par capacité, les enchaîne toutes les 0,6 s sur les adversaires les plus proches (un différent à chaque fois si possible), puis une attaque combinée finale (zone 120 + 12 x n px, dégâts 14 + 9 x n, poussée).
- Recharge de fusion : 7 s + 2,5 s par capacité (12 s pour 2), bien supérieure aux recharges normales ; le disque affiche le compte à rebours.
- Les capacités reviennent individuelles à la défusion, avec leurs charges propres.

## VENT (fruit poire) — spécification officielle
Dégâts (14 + 4 x niveau) et étourdissement (1 + 0,15 x niveau) d'origine conservés. Portée niv.1 = 270 px.

| Niv. | Comportement | Portée |
|---|---|---|
| 1 | Un souffle vers l'ennemi le plus proche (ou celui dans la direction visée) ; un seul ennemi est repoussé | 270 |
| 2 | Onde à 360° simultanée, tous les ennemis du rayon sont repoussés | 540 (exactement 2 x niv.1) |
| 3 | Un tourbillon visible : tourne autour du joueur en s'éloignant en spirale (3,6 s). Capture 2 personnages au maximum | 340 |
| 4 | Deux tourbillons qui tournent autour du joueur et l'accompagnent 6 s. Chacun capture 2 personnages au plus ; en capturant, il quitte le joueur et emporte sa prise | 260 |
| 5 | Onde 360° immédiate, puis (0,35 s après) 4 tourbillons : 2 défensifs (orbite, 8 s, partent avec leur prise) et 2 offensifs (7 s, poursuivent les adversaires sur la carte) | 540 |

Capture : le personnage est étourdi (aucune action), soulevé et entraîné 0,9 s, puis lancé violemment à l'opposé du lanceur avec les dégâts du vent. Une cible relâchée est immunisée 1,4 s contre une nouvelle capture. Les tourbillons disparaissent si leur propriétaire meurt.

## RAYON D'ACTION (toutes capacités)
Un cercle à la portée de chaque capacité prête placée dans l'analogue est dessiné autour du joueur ; il s'intensifie quand un ennemi y entre. Il est dessiné uniquement pour le joueur local, jamais pour les autres.

## FOURCHE (ancienne « Faux », fruit ananas) — spécification officielle
Nom affiché : Fourche (identifiant interne `scythe` inchangé). Arme : longue fourche du diable noire à lueur violette, trois dents, anneaux violets, particules violettes ; toujours dessinée pendant l'attaque. Dégâts directs 24 + 5 x niveau (valeurs d'origine). 5 utilisations puis recharge. Une seule attaque de fourche à la fois (pas de charge perdue).

| Niv. | Arme | Mouvement | Effets |
|---|---|---|---|
| 1 | Une fourche | S'allonge brusquement et balaie 120° devant, puis revient | Portée 200 px (110 avant) |
| 2 | Deux fourches | Partent de deux côtés opposés et se croisent devant en 0,2 s, frappent simultanément | Portée 200, 2 coups par ennemi |
| 3 | Une grande fourche (x1,55) | Même balayage 120°, portée 200 | Poison dégressif (60 sur 5 s, fort au début) ; dégâts reçus divisés par 2 tant que le niveau 3 est équipé |
| 4 | Deux grandes fourches | Se croisent comme au niveau 2 | Poison dégressif plus fort (100 sur 5,5 s), 2 coups par ennemi |
| 5 | Très grande fourche avec petite tête de mort | Balayage de 180° devant puis 180° derrière (une seule activation) | Portée 180 px ; poison constant de 4 PV/s par petits paliers, jusqu'à la mort ou un soin (tout gain de PV l'arrête) ; recharge 9 s (5 s aux niveaux 1 à 4) |

Notes : le poison utilise le système de dégâts sur la durée existant (dégressif pour N3-N4, constant pour N5). Correction de bug au passage : les dégâts sur la durée (brûlure, poison) ne s'appliquaient pas aux personnages qui n'avaient jamais eu de bouclier (condition `st.shield <= 0` fausse quand la valeur n'existe pas) ; corrigé dans game.js.

## GLACE (fruit myrtille givrée) — spécification officielle
Dégâts et gel ajustés pour l'équilibrage. Recharge après 5 utilisations : 7 s (niv.1 à 3), 8 s (niv.4), 10 s (niv.5).

| Niv. | Comportement | Portée | Effets |
|---|---|---|---|
| 1 | Zone autour du joueur pendant 3,2 s ; l'ennemi le plus proche qui y entre est gelé. Un seul gelé à la fois (le suivant peut l'être après la fin du gel) | 170 | 20 dégâts, gel 1,4 s |
| 2 | Même zone : tous les ennemis qui y entrent sont gelés ensemble | 190 | 24 dégâts, gel 1,7 s |
| 3 | Zone ; quand un ennemi y entre, une trajectoire de piques surgit du sol depuis le joueur et poursuit la cible jusqu'à l'impact (une cible par lancer) | 210 | 34 dégâts + gel 1,7 s à l'impact |
| 4 | 4 cercles de piques (rayons 70, 130, 190, 250) sortent l'un après l'autre à 360°, s'enfoncent puis laissent place au suivant ; aucune poursuite | 260 | 14 dégâts par cercle touché (jusqu'à 4 fois), ralentissement 55 % pendant 2,2 s, jamais de gel |
| 5 | Piège posé à l'endroit visé (ou devant le joueur, même sans ennemi) : grande sphère transparente à flocons, rayon 120 px, armée 10 s. L'ennemi qui y entre est ralenti progressivement (jusqu'à 95 %) puis gelé après 1,6 s de présence ; gel de 1,8 s ; juste avant la fin du gel, piques sur toute la surface | 300 (distance de pose) | 60 dégâts aux ennemis gelés, ils sont libérés, la zone disparaît ; un ennemi qui sort à temps n'est pas gelé |

Choix d'équilibrage : un seul gel par ennemi et par zone, pas de gel pendant le niveau 4, explosion du niveau 5 limitée à 60 dégâts (moins du quart des PV d'un joueur de niveau 1), gel limité à 1,8 s, ennemis libres de sortir pendant les 1,6 s de ralentissement.

## TROU NOIR (niveaux 1 à 5) — en attente de validation

- Charges : 2 seulement pour le trou noir (les autres capacités gardent 5). Recharge à 0 charge : 18 s (niv. 1-4), 26 s (niv. 5).
- Niv. 1 : portée 280, aspire en 8 s max, absorbe 1 ennemi (le boss perd 35 % de sa vie au lieu d'être tué).
- Niv. 2 : absorbe 2 ennemis, durée max 20 s. Niv. 3 : 3 ennemis. Niv. 4 : 4 ennemis.
- Niv. 1-4 : le trou reste en place, attire les ennemis (420 px/s, boss 160), absorbe ceux qui touchent le cœur, se ferme (0,35 s) quand la capacité est atteinte ou le temps écoulé. Les points affichent la capacité restante.
- Niv. 5 : trou de rayon 150 qui suit le lanceur pendant 4 s, absorbe instantanément tout ennemi dans le rayon, anneau de temps visible. Un seul trou niv. 5 à la fois.
- L'absorption ignore bouclier et invulnérabilité de capacité.
- Tests : t83 (19/19), régressions t60 40/40, t72 15/15, t70/t74/t79/t81 sans erreur JS. Non testé : téléphone réel, multijoueur.
