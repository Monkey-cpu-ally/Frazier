#if UNITY_EDITOR
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.Rendering;
using UnityEngine.Rendering.Universal;
using UnityEngine.SceneManagement;
using UnityEngine.Tilemaps;

namespace HyperAxel.EditorTools
{
    /// <summary>
    /// One-click starter: creates a URP 2D render pipeline asset, a sample scene
    /// with camera + player + ground tilemap + HUD canvas + all managers, and
    /// assigns everything. Run this the first time you open the project in Unity 6.
    ///
    /// Menu: HyperAxel -> Create Starter Scene (run once)
    /// </summary>
    public static class StarterSceneBuilder
    {
        const string UrpAssetPath     = "Assets/Settings/URP/HyperAxel_URP.asset";
        const string Urp2DRendererPath= "Assets/Settings/URP/HyperAxel_2DRenderer.asset";
        const string SampleScenePath  = "Assets/Scenes/SampleScene.unity";
        const string WorkshopTreePath = "Assets/Resources/WorkshopUpgradeTree.asset";

        [MenuItem("HyperAxel/Create Starter Scene")]
        public static void Build()
        {
            EnsureFolders();
            var urp = EnsureUrpAsset();
            var tree = EnsureWorkshopTree();

            // New scene
            var scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);
            scene.name = "SampleScene";

            // Main camera
            var camGo = new GameObject("Main Camera");
            camGo.tag = "MainCamera";
            var cam = camGo.AddComponent<Camera>();
            cam.orthographic = true;
            cam.orthographicSize = 6;
            cam.backgroundColor = new Color(0.06f, 0.08f, 0.10f);
            cam.clearFlags = CameraClearFlags.SolidColor;
            camGo.AddComponent<AudioListener>();
            camGo.transform.position = new Vector3(0, 0, -10);

            // Managers
            var managers = new GameObject("Managers");
            var gm = managers.AddComponent<GameManager>();
            managers.AddComponent<AssistManager>();
            managers.AddComponent<PowerManager>();
            managers.AddComponent<AchievementTracker>();
            var workshop = managers.AddComponent<WorkshopController>();
            workshop.tree = tree;

            // Ground tilemap (with CompositeCollider2D for merged ground collision)
            var grid = new GameObject("Grid").AddComponent<Grid>();
            var tmGo = new GameObject("Ground");
            tmGo.transform.SetParent(grid.transform);
            var tm = tmGo.AddComponent<Tilemap>();
            var tmr = tmGo.AddComponent<TilemapRenderer>();
            tmr.sortingOrder = 0;
            var tmc = tmGo.AddComponent<TilemapCollider2D>();
            tmc.compositeOperation = Collider2D.CompositeOperation.Merge;
            var rb = tmGo.AddComponent<Rigidbody2D>();
            rb.bodyType = RigidbodyType2D.Static;
            tmGo.AddComponent<CompositeCollider2D>();
            tmGo.layer = LayerMask.NameToLayer("Default");

            // Quick solid ground row so you can press Play immediately.
            var tile = ScriptableObject.CreateInstance<Tile>();
            tile.sprite = UnityEditor.AssetDatabase.GetBuiltinExtraResource<Sprite>("UI/Skin/Background.psd");
            tile.colliderType = Tile.ColliderType.Sprite;
            for (int x = -12; x <= 12; x++) tm.SetTile(new Vector3Int(x, -4, 0), tile);

            // Player
            var player = new GameObject("Player");
            player.transform.position = new Vector3(0, 0, 0);
            var sr = player.AddComponent<SpriteRenderer>();
            sr.color = new Color(0.9f, 0.6f, 0.2f);
            sr.sprite = UnityEditor.AssetDatabase.GetBuiltinExtraResource<Sprite>("UI/Skin/Knob.psd");
            var pcc = player.AddComponent<CapsuleCollider2D>();
            pcc.size = new Vector2(0.6f, 1.1f);
            var prb = player.AddComponent<Rigidbody2D>();
            prb.freezeRotation = true;
            prb.gravityScale = 3f;
            var axel = player.AddComponent<AxelController>();

            // Ground / wall check children
            var groundCheck = new GameObject("GroundCheck");
            groundCheck.transform.SetParent(player.transform);
            groundCheck.transform.localPosition = new Vector3(0, -0.6f, 0);
            var wallR = new GameObject("WallRight"); wallR.transform.SetParent(player.transform); wallR.transform.localPosition = new Vector3( 0.35f, 0, 0);
            var wallL = new GameObject("WallLeft");  wallL.transform.SetParent(player.transform); wallL.transform.localPosition = new Vector3(-0.35f, 0, 0);
            axel.groundCheck    = groundCheck.transform;
            axel.wallCheckRight = wallR.transform;
            axel.wallCheckLeft  = wallL.transform;
            axel.groundMask = LayerMask.GetMask("Default");

            gm.player = axel;

            // HUD Canvas
            var canvasGo = new GameObject("HUD Canvas",
                typeof(Canvas),
                typeof(UnityEngine.UI.CanvasScaler),
                typeof(UnityEngine.UI.GraphicRaycaster),
                typeof(HUDController));
            canvasGo.GetComponent<Canvas>().renderMode = RenderMode.ScreenSpaceOverlay;
            gm.hud = canvasGo.GetComponent<HUDController>();

            // Save + set as default
            EditorSceneManager.SaveScene(scene, SampleScenePath);
            EditorBuildSettings.scenes = new[] { new EditorBuildSettingsScene(SampleScenePath, true) };
            GraphicsSettings.defaultRenderPipeline = urp;
            QualitySettings.renderPipeline = urp;

            EditorUtility.DisplayDialog("HyperAxel",
                "Starter scene created!\n\nPress Play to run. Assign the claymation sprites from Assets/Sprites/Enemies/ to EnemyBase subclasses to replace the placeholders.",
                "Got it");
        }

        static void EnsureFolders()
        {
            string[] folders = { "Assets/Settings", "Assets/Settings/URP", "Assets/Scenes", "Assets/Resources", "Assets/Prefabs" };
            foreach (var f in folders)
                if (!AssetDatabase.IsValidFolder(f))
                    AssetDatabase.CreateFolder(System.IO.Path.GetDirectoryName(f).Replace('\\', '/'),
                                               System.IO.Path.GetFileName(f));
        }

        static UniversalRenderPipelineAsset EnsureUrpAsset()
        {
            var urp = AssetDatabase.LoadAssetAtPath<UniversalRenderPipelineAsset>(UrpAssetPath);
            if (urp != null) return urp;

            // Create URP pipeline asset
            var renderer2D = ScriptableObject.CreateInstance<Renderer2DData>();
            AssetDatabase.CreateAsset(renderer2D, Urp2DRendererPath);
            urp = UniversalRenderPipelineAsset.Create(renderer2D);
            AssetDatabase.CreateAsset(urp, UrpAssetPath);
            AssetDatabase.SaveAssets();
            return urp;
        }

        static WorkshopUpgradeTree EnsureWorkshopTree()
        {
            var tree = AssetDatabase.LoadAssetAtPath<WorkshopUpgradeTree>(WorkshopTreePath);
            if (tree != null) return tree;
            tree = ScriptableObject.CreateInstance<WorkshopUpgradeTree>();
            AssetDatabase.CreateAsset(tree, WorkshopTreePath);
            AssetDatabase.SaveAssets();
            return tree;
        }
    }
}
#endif
