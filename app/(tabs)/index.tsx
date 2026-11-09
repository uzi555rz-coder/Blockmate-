import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import { useEffect, useMemo, useState } from "react";
import {
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import {
  BLOCKMATE_MODES,
  SAFETY_RULES,
  getMode,
  type AutomationModeId,
  type RunState,
} from "@/lib/blockmate";
import { armBridge, getBridgeStatus, getScreenCaptureStatus, isNativeBridgeAvailable, openAccessibilitySettings, requestScreenCapture, stopBridge, type BlockMateNativeStatus, type BlockMateScreenCaptureStatus } from "@/lib/blockmate-native";
import { analyzeBlueprint, buildOrder, type BlueprintAnalysis } from "@/lib/building";

const COLORS = {
  background: "#101713",
  panel: "#17221D",
  panelRaised: "#1E2C25",
  panelSoft: "#22332A",
  line: "#2C4034",
  text: "#F4F2E9",
  muted: "#9AA99E",
  moss: "#A7D46F",
  sand: "#E6C88E",
  coral: "#F07862",
  blue: "#8FB3C8",
  white: "#FFFFFF",
};

const LOGO = require("../../assets/images/icon.png");

function Icon({ name, color = COLORS.text, size = 20 }: { name: string; color?: string; size?: number }) {
  return <Ionicons name={name as never} color={color} size={size} />;
}

function StatePill({ state }: { state: RunState }) {
  const config: Record<RunState, { label: string; color: string; icon: string }> = {
    idle: { label: "Needs calibration", color: COLORS.sand, icon: "ellipse-outline" },
    calibrated: { label: "Calibrated", color: COLORS.moss, icon: "checkmark-circle-outline" },
    running: { label: "Running", color: COLORS.moss, icon: "radio-button-on-outline" },
    paused: { label: "Paused", color: COLORS.sand, icon: "pause-circle-outline" },
    stopped: { label: "Stopped safely", color: COLORS.blue, icon: "stop-circle-outline" },
    safety_stop: { label: "Safety stop", color: COLORS.coral, icon: "warning-outline" },
  };
  const item = config[state];
  return (
    <View style={[styles.statePill, { borderColor: `${item.color}55`, backgroundColor: `${item.color}14` }]}>
      <Icon name={item.icon} color={item.color} size={15} />
      <Text style={[styles.statePillText, { color: item.color }]}>{item.label}</Text>
    </View>
  );
}

function SectionLabel({ children, right }: { children: string; right?: string }) {
  return (
    <View style={styles.sectionLabelRow}>
      <Text style={styles.sectionLabel}>{children}</Text>
      {right ? <Text style={styles.sectionLabelRight}>{right}</Text> : null}
    </View>
  );
}

function ModeCard({ id, selected, onPress }: { id: AutomationModeId; selected: boolean; onPress: () => void }) {
  const mode = getMode(id);
  const active = mode.status === "active";
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${mode.label}, ${active ? "active" : "planned"}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.modeCard,
        selected && styles.modeCardSelected,
        { borderColor: selected ? mode.accent : COLORS.line, opacity: pressed ? 0.82 : 1 },
      ]}
    >
      <View style={[styles.modeIcon, { backgroundColor: `${mode.accent}1C` }]}>
        <Icon name={mode.icon} color={mode.accent} size={20} />
      </View>
      <Text style={[styles.modeCardLabel, selected && { color: COLORS.text }]}>{mode.shortLabel}</Text>
      <View style={styles.modeCardStatus}>
        <View style={[styles.statusDot, { backgroundColor: active ? COLORS.moss : COLORS.muted }]} />
        <Text style={styles.modeCardStatusText}>{active ? "ACTIVE" : "PLANNED"}</Text>
      </View>
    </Pressable>
  );
}

function SafetyChip({ label, value, detail, color }: { label: string; value: string; detail: string; color: string }) {
  return (
    <View style={styles.safetyChip}>
      <View style={styles.safetyChipTop}>
        <View style={[styles.safetyDot, { backgroundColor: color }]} />
        <Text style={styles.safetyChipLabel}>{label}</Text>
      </View>
      <Text style={[styles.safetyChipValue, { color }]}>{value}</Text>
      <Text style={styles.safetyChipDetail}>{detail}</Text>
    </View>
  );
}

function Sheet({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <Modal transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.sheet}>{children}</View>
      </View>
    </Modal>
  );
}

export default function HomeScreen() {
  const [selectedMode, setSelectedMode] = useState<AutomationModeId>("farm");
  const [runState, setRunState] = useState<RunState>("idle");
  const [calibrated, setCalibrated] = useState(false);
  const [introVisible, setIntroVisible] = useState(false);
  const [calibrationVisible, setCalibrationVisible] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [buildingVisible, setBuildingVisible] = useState(false);
  const [calibrationStep, setCalibrationStep] = useState(1);
  const [calibrationChecks, setCalibrationChecks] = useState([false, false, false]);
  const [limits, setLimits] = useState<Record<AutomationModeId, number>>(
    Object.fromEntries(BLOCKMATE_MODES.map((mode) => [mode.id, mode.defaultLimit])) as Record<AutomationModeId, number>,
  );
  const [actionCount, setActionCount] = useState(0);
  const [toast, setToast] = useState("Ready when you are.");
  const [phase, setPhase] = useState("Waiting for calibration");
  const [bridgeStatus, setBridgeStatus] = useState<BlockMateNativeStatus | null>(null);
  const [screenCaptureStatus, setScreenCaptureStatus] = useState<BlockMateScreenCaptureStatus | null>(null);
  const [blueprint, setBlueprint] = useState<BlueprintAnalysis | null>(null);
  const [buildStage, setBuildStage] = useState<"file" | "land" | "ready">("file");
  const [buildAssistVisible, setBuildAssistVisible] = useState(false);
  const [assistLayerIndex, setAssistLayerIndex] = useState(0);
  const [assistPlacedCount, setAssistPlacedCount] = useState(0);
  const [assistOpacity, setAssistOpacity] = useState(70);

  const mode = useMemo(() => getMode(selectedMode), [selectedMode]);
  const isRunning = runState === "running";
  const isPaused = runState === "paused";
  const isActiveMode = mode.status === "active";
  const currentLimit = limits[selectedMode];
  const progress = Math.min(100, Math.round((actionCount / Math.max(currentLimit, 1)) * 100));
  const livePhases = selectedMode === "build" ? ["Checking allotted land", "Selecting block", "Placing block", "Verifying layer"] : ["Checking plot", "Harvesting row", "Replanting row", "Returning to anchor"];
  const currentPhase = isRunning ? livePhases[actionCount % livePhases.length] : phase;
  const blueprintLayers = useMemo(() => {
    if (!blueprint) return [];
    return [...new Set(blueprint.blocks.map((block) => block.y))].sort((a, b) => a - b);
  }, [blueprint]);
  const currentAssistLayer = blueprintLayers[assistLayerIndex] ?? 0;
  const currentLayerBlocks = useMemo(
    () => blueprint?.blocks.filter((block) => block.y === currentAssistLayer) ?? [],
    [blueprint, currentAssistLayer],
  );
  const assistOrder = useMemo(() => (blueprint ? buildOrder(blueprint) : []), [blueprint]);
  const nextAssistBlock = assistOrder[assistPlacedCount] ?? null;
  const assistProgress = assistOrder.length ? Math.round((assistPlacedCount / assistOrder.length) * 100) : 0;

  useEffect(() => {
    void AsyncStorage.multiGet(["blockmate:intro-seen", "blockmate:calibrated"]).then((entries) => {
      const introSeen = entries.find(([key]) => key === "blockmate:intro-seen")?.[1];
      const savedCalibration = entries.find(([key]) => key === "blockmate:calibrated")?.[1];
      if (savedCalibration === "true") {
        setCalibrated(true);
        setRunState("calibrated");
        setPhase("Farm anchor ready");
      }
      if (introSeen !== "true") setIntroVisible(true);
    });
  }, []);

  useEffect(() => {
    if (!isRunning) return;
    const timer = setInterval(() => setActionCount((value) => value + 1), 850);
    return () => clearInterval(timer);
  }, [isRunning]);

  useEffect(() => {
    if (!isRunning) return;
    if (actionCount >= currentLimit) {
      const timer = setTimeout(() => {
        setRunState("stopped");
        setToast("Run complete. Farming loop stopped safely.");
        setPhase("Farm anchor ready");
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [actionCount, currentLimit, isRunning]);

  function dismissIntro() {
    setIntroVisible(false);
    void AsyncStorage.setItem("blockmate:intro-seen", "true");
  }

  function beginCalibration() {
    setCalibrationStep(1);
    setCalibrationChecks([false, false, false]);
    setCalibrationVisible(true);
    void refreshBridgeStatus();
    void refreshScreenCaptureStatus();
  }

  async function refreshBridgeStatus() {
    const status = await getBridgeStatus();
    setBridgeStatus(status);
  }

  async function refreshScreenCaptureStatus() {
    const status = await getScreenCaptureStatus();
    setScreenCaptureStatus(status);
  }

  async function captureMinecraftScreen() {
    try {
      const status = await requestScreenCapture();
      setScreenCaptureStatus(status);
      setToast("Android capture consent requested. BlockMate will save one local frame for recognition.");
    } catch {
      setToast("Screen recognition is available only in the Android APK.");
    }
  }

  async function openNativeAccessibilitySettings() {
    try {
      await openAccessibilitySettings();
      setToast("Enable BlockMate Minecraft controls, then return here.");
    } catch {
      setToast("Native Android bridge is available only in the custom APK build.");
    }
  }

  async function chooseBlueprint() {
    const result = await DocumentPicker.getDocumentAsync({
      type: "application/json",
      copyToCacheDirectory: true,
      multiple: false,
    });
    if (result.canceled || !result.assets[0]) return;
    try {
      const asset = result.assets[0];
      const text = Platform.OS === "web"
        ? await fetch(asset.uri).then((response) => response.text())
        : await FileSystem.readAsStringAsync(asset.uri);
      const nextBlueprint = analyzeBlueprint(JSON.parse(text), asset.name.replace(/\.json$/i, ""));
      setBlueprint(nextBlueprint);
      setBuildStage("land");
      setAssistLayerIndex(0);
      setAssistPlacedCount(0);
      setToast(`${nextBlueprint.name} analyzed. Confirm the allotted land next.`);
    } catch {
      setToast("This file could not be analyzed. Use the JSON blueprint format shown in the builder.");
    }
  }

  function openBuilder() {
    setBuildingVisible(true);
    if (!blueprint) setBuildStage("file");
  }

  function confirmLand() {
    if (!blueprint) return;
    setBuildStage("ready");
    setToast("Allotted land recorded. The build order is ready for confirmation.");
  }

  function openBuildAssist() {
    if (!blueprint) return;
    setAssistLayerIndex(0);
    setAssistPlacedCount(0);
    setBuildAssistVisible(true);
  }

  function markAssistBlockPlaced() {
    if (!nextAssistBlock) return;
    setAssistPlacedCount((value) => Math.min(value + 1, assistOrder.length));
    setToast("Block marked placed. The guide advanced without sending a Minecraft action.");
  }

  function completeCalibration() {
    setCalibrated(true);
    setRunState("calibrated");
    setPhase("Farm anchor ready");
    setToast("Calibration saved. Safety checks are armed.");
    setCalibrationVisible(false);
    void AsyncStorage.setItem("blockmate:calibrated", "true");
  }

  function startRun() {
    if (selectedMode === "build") {
      if (!blueprint || buildStage !== "ready") {
        openBuilder();
        return;
      }
      setConfirmVisible(true);
      return;
    }
    if (!isActiveMode) {
      setToast(`${mode.shortLabel} is staged for a later build.`);
      return;
    }
    if (!calibrated) {
      setToast("Calibrate your Minecraft controls before starting.");
      setCalibrationVisible(true);
      return;
    }
    setConfirmVisible(true);
  }

  async function confirmStart() {
    if (isNativeBridgeAvailable()) {
      try {
        const status = await armBridge();
        if (!status.minecraftForeground) {
          setToast("Open Minecraft Bedrock first; no gesture was sent.");
          return;
        }
      } catch {
        setToast("Enable BlockMate Minecraft controls before starting.");
        return;
      }
    }
    setConfirmVisible(false);
    setActionCount(0);
    setPhase(selectedMode === "build" ? "Checking allotted land" : "Checking plot");
    setToast(selectedMode === "build" ? "Build sequence running. Keep the allotted land visible in Minecraft." : "Prototype loop running. Keep Minecraft in the calibrated view.");
    setRunState("running");
  }

  async function pauseRun() {
    if (isNativeBridgeAvailable()) await stopBridge();
    setRunState("paused");
    setToast("Automation paused. Your world is safe.");
  }

  async function resumeRun() {
    if (isNativeBridgeAvailable()) {
      try {
        const status = await armBridge();
        if (!status.minecraftForeground) {
          setToast("Open Minecraft Bedrock first; automation remains paused.");
          return;
        }
      } catch {
        setToast("Enable BlockMate Minecraft controls before resuming.");
        return;
      }
    }
    setRunState("running");
    setToast("Automation resumed. Safety checks remain armed.");
  }

  async function stopRun() {
    if (isNativeBridgeAvailable()) await stopBridge();
    setRunState(calibrated ? "stopped" : "idle");
    setPhase(calibrated ? "Farm anchor ready" : "Waiting for calibration");
    setToast("Emergency stop received. No more actions will be sent.");
  }

  function adjustLimit(delta: number) {
    if (isRunning || isPaused) return;
    const next = Math.min(mode.maxLimit, Math.max(mode.minLimit, currentLimit + delta));
    setLimits((previous) => ({ ...previous, [selectedMode]: next }));
  }

  return (
    <ScreenContainer containerClassName="bg-[#101713]" safeAreaClassName="bg-[#101713]" edges={["top", "left", "right", "bottom"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.brandRow}>
            <Image source={LOGO} style={styles.logo} />
            <View>
              <Text style={styles.wordmark}>BlockMate</Text>
              <Text style={styles.eyebrow}>SURVIVAL CONSOLE</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <View style={styles.previewTag}>
              <View style={styles.previewDot} />
              <Text style={styles.previewText}>{Platform.OS === "web" ? "PREVIEW" : "DEVICE"}</Text>
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel="Open setup guide" onPress={() => setIntroVisible(true)} style={styles.headerButton}>
              <Icon name="help-circle-outline" color={COLORS.muted} size={22} />
            </Pressable>
          </View>
        </View>

        <View style={styles.heroRow}>
          <View style={styles.heroCopy}>
            <Text style={styles.heroKicker}>UNMODIFIED BEDROCK</Text>
            <Text style={styles.heroTitle}>Calibrate once.{"\n"}Run carefully.</Text>
            <Text style={styles.heroBody}>A small safety console for repeatable work in your survival world.</Text>
          </View>
          <View style={styles.heroBadge}>
            <Icon name="shield-checkmark-outline" color={COLORS.moss} size={28} />
            <Text style={styles.heroBadgeText}>WORLD{"\n"}SAFE</Text>
          </View>
        </View>

        <View style={styles.statusCard}>
          <View style={styles.statusCardTop}>
            <View>
              <Text style={styles.cardEyebrow}>CURRENT RUN</Text>
              <Text style={styles.statusTitle}>{isRunning ? "Farming loop" : mode.label}</Text>
            </View>
            <StatePill state={runState} />
          </View>
          <View style={styles.statusDivider} />
          <View style={styles.statusTelemetry}>
            <View style={styles.telemetryBlock}>
              <Text style={styles.telemetryLabel}>PHASE</Text>
              <Text style={styles.telemetryValue}>{currentPhase}</Text>
            </View>
            <View style={styles.telemetryBlockRight}>
              <Text style={styles.telemetryLabel}>PROGRESS</Text>
              <Text style={styles.telemetryValue}>{progress}%</Text>
            </View>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.toast}>{toast}</Text>
        </View>

        <SectionLabel right="6 MODES">AUTOMATION DECK</SectionLabel>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.modeRail}>
          {BLOCKMATE_MODES.map((item) => (
            <ModeCard key={item.id} id={item.id} selected={selectedMode === item.id} onPress={() => setSelectedMode(item.id)} />
          ))}
        </ScrollView>

        <View style={[styles.modePanel, { borderColor: `${mode.accent}66` }]}>
          <View style={styles.modePanelHeader}>
            <View style={[styles.largeModeIcon, { backgroundColor: `${mode.accent}1A` }]}>
              <Icon name={mode.icon} color={mode.accent} size={28} />
            </View>
            <View style={styles.modePanelTitleWrap}>
              <View style={styles.titleLine}>
                <Text style={styles.modePanelTitle}>{mode.label}</Text>
                <View style={[styles.inlineStatus, { backgroundColor: mode.status === "active" ? `${COLORS.moss}1C` : `${COLORS.muted}18` }]}>
                  <Text style={[styles.inlineStatusText, { color: mode.status === "active" ? COLORS.moss : COLORS.muted }]}>{mode.status === "active" ? "ACTIVE" : "PLANNED"}</Text>
                </View>
              </View>
              <Text style={styles.modePanelBody}>{mode.description}</Text>
            </View>
          </View>

          {mode.id === "build" ? (
            <View style={styles.blueprintSummary}>
              <View style={styles.blueprintSummaryTop}>
                <View>
                  <Text style={styles.settingLabel}>BLUEPRINT FILE</Text>
                  <Text style={styles.settingHint}>{blueprint ? `${blueprint.name} · ${blueprint.totalBlocks} blocks` : "No building file analyzed yet"}</Text>
                </View>
                <Icon name={blueprint ? "checkmark-circle" : "document-outline"} color={blueprint ? COLORS.moss : COLORS.sand} size={22} />
              </View>
              {blueprint ? <Text style={styles.blueprintDimensions}>{blueprint.dimensions.width}W × {blueprint.dimensions.height}H × {blueprint.dimensions.length}L · {blueprint.materials.length} materials</Text> : null}
              <Pressable accessibilityRole="button" onPress={openBuilder} style={({ pressed }) => [styles.blueprintButton, { opacity: pressed ? 0.8 : 1 }]}>
                <Text style={styles.blueprintButtonText}>{blueprint ? "REVIEW BUILD PLAN" : "CHOOSE BUILDING FILE"}</Text>
                <Icon name="arrow-forward" color={COLORS.background} size={17} />
              </Pressable>
              {blueprint && buildStage === "ready" ? (
                <Pressable accessibilityRole="button" onPress={openBuildAssist} style={({ pressed }) => [styles.guideButton, { opacity: pressed ? 0.8 : 1 }]}>
                  <Icon name="layers-outline" color={COLORS.sand} size={17} />
                  <Text style={styles.guideButtonText}>OPEN SIDE-BY-SIDE GUIDE</Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}

          <View style={styles.settingRow}>
            <View>
              <Text style={styles.settingLabel}>{mode.limitLabel.toUpperCase()}</Text>
              <Text style={styles.settingHint}>Safe default · adjust before a run</Text>
            </View>
            <View style={styles.stepper}>
              <Pressable accessibilityRole="button" accessibilityLabel="Decrease limit" onPress={() => adjustLimit(-mode.step)} style={({ pressed }) => [styles.stepperButton, { opacity: pressed ? 0.6 : 1 }]}>
                <Icon name="remove" color={COLORS.text} size={18} />
              </Pressable>
              <View style={styles.stepperValueWrap}>
                <Text style={styles.stepperValue}>{currentLimit}</Text>
                <Text style={styles.stepperUnit}>{mode.unit}</Text>
              </View>
              <Pressable accessibilityRole="button" accessibilityLabel="Increase limit" onPress={() => adjustLimit(mode.step)} style={({ pressed }) => [styles.stepperButton, { opacity: pressed ? 0.6 : 1 }]}>
                <Icon name="add" color={COLORS.text} size={18} />
              </Pressable>
            </View>
          </View>

          <View style={styles.calibrationRow}>
            <View style={styles.calibrationCopy}>
              <Icon name={calibrated ? "checkmark-circle" : "locate-outline"} color={calibrated ? COLORS.moss : COLORS.sand} size={20} />
              <View>
                <Text style={styles.calibrationTitle}>{calibrated ? "Controls calibrated" : "Calibration required"}</Text>
                <Text style={styles.calibrationDetail}>{calibrated ? "Portrait layout · farm anchor saved" : "Match touch targets before sending actions"}</Text>
              </View>
            </View>
            <Pressable accessibilityRole="button" onPress={beginCalibration} style={({ pressed }) => [styles.textButton, { opacity: pressed ? 0.6 : 1 }]}>
              <Text style={styles.textButtonText}>{calibrated ? "RECALIBRATE" : "CALIBRATE"}</Text>
            </Pressable>
          </View>

          {mode.status === "planned" ? (
            <View style={styles.plannedNotice}>
              <Icon name="construct-outline" color={COLORS.muted} size={18} />
              <Text style={styles.plannedNoticeText}>This mode is prepared in the prototype and will be activated after the farming loop is proven safe.</Text>
            </View>
          ) : null}
        </View>

        <SectionLabel right="ALWAYS ARMED">SAFETY MONITOR</SectionLabel>
        <View style={styles.safetyPanel}>
          {SAFETY_RULES.map((rule) => (
            <SafetyChip key={rule.label} {...rule} />
          ))}
        </View>
        <Text style={styles.disclaimer}>BlockMate never edits your world or asks for a Microsoft password. The Android gesture bridge is included in the custom APK build; the Web preview remains a simulation.</Text>

        <View style={styles.controlShelf}>
          <Pressable accessibilityRole="button" accessibilityLabel="Stop automation" onPress={stopRun} style={({ pressed }) => [styles.stopButton, { opacity: pressed ? 0.72 : 1 }]}>
            <Icon name="stop" color={COLORS.white} size={22} />
            <Text style={styles.stopButtonText}>STOP</Text>
          </Pressable>
          <Pressable accessibilityRole="button" disabled={!isActiveMode || runState === "safety_stop"} onPress={isPaused ? resumeRun : isRunning ? pauseRun : startRun} style={({ pressed }) => [styles.startButton, !isActiveMode && styles.buttonDisabled, { opacity: pressed ? 0.8 : 1 }]}>
            <Icon name={isPaused ? "play" : isRunning ? "pause" : "play"} color={COLORS.background} size={20} />
            <Text style={styles.startButtonText}>{isPaused ? "RESUME" : isRunning ? "PAUSE" : selectedMode === "build" ? "START BUILD" : isActiveMode ? "START FARMING" : "PLANNED MODE"}</Text>
          </Pressable>
        </View>
      </ScrollView>

      {introVisible ? (
        <Sheet onClose={dismissIntro}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetIcon}><Icon name="shield-checkmark-outline" color={COLORS.moss} size={30} /></View>
          <Text style={styles.sheetEyebrow}>BEFORE YOU RUN</Text>
          <Text style={styles.sheetTitle}>A careful companion, not a Minecraft mod.</Text>
          <Text style={styles.sheetBody}>BlockMate is designed around your unmodified Bedrock world. The prototype needs a calibrated portrait layout and, on Android, Accessibility plus screen-recognition access to send and verify gestures.</Text>
          <View style={styles.infoList}>
            {[
              ["No world edits", "No add-ons, behavior packs, or server changes."],
              ["No passwords", "Your Microsoft login stays inside Minecraft."],
              ["Stop anytime", "STOP is always available and ends the loop immediately."],
            ].map(([title, body]) => (
              <View key={title} style={styles.infoItem}>
                <View style={styles.infoBullet}><Icon name="checkmark" color={COLORS.moss} size={14} /></View>
                <View style={styles.infoText}><Text style={styles.infoTitle}>{title}</Text><Text style={styles.infoBody}>{body}</Text></View>
              </View>
            ))}
          </View>
          <Pressable accessibilityRole="button" onPress={dismissIntro} style={({ pressed }) => [styles.sheetPrimaryButton, { opacity: pressed ? 0.82 : 1 }]}>
            <Text style={styles.sheetPrimaryText}>I UNDERSTAND</Text>
            <Icon name="arrow-forward" color={COLORS.background} size={18} />
          </Pressable>
        </Sheet>
      ) : null}

      {buildingVisible ? (
        <Sheet onClose={() => setBuildingVisible(false)}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetTitleRow}>
            <View><Text style={styles.sheetEyebrow}>BUILDING / {buildStage === "file" ? "1 OF 3" : buildStage === "land" ? "2 OF 3" : "3 OF 3"}</Text><Text style={styles.sheetTitle}>Blueprint Builder</Text></View>
            <Pressable onPress={() => setBuildingVisible(false)}><Icon name="close" color={COLORS.muted} size={24} /></Pressable>
          </View>
          {buildStage === "file" ? (
            <>
              <Text style={styles.sheetBody}>Choose a JSON building file. BlockMate will study its blocks, calculate dimensions, and list the materials before anything is sent to Minecraft.</Text>
              <View style={styles.formatBox}><Text style={styles.formatBoxTitle}>SUPPORTED FIRST FORMAT</Text><Text style={styles.formatBoxBody}>A JSON object with a name and blocks containing x, y, z, and block fields.</Text><Text style={styles.formatCode}>{'{ "blocks": [{ "x": 0, "y": 0, "z": 0, "block": "minecraft:stone" }] }'}</Text></View>
              <Pressable accessibilityRole="button" onPress={() => void chooseBlueprint()} style={styles.sheetPrimaryButton}><Text style={styles.sheetPrimaryText}>CHOOSE BUILDING FILE</Text><Icon name="document-attach-outline" color={COLORS.background} size={18} /></Pressable>
            </>
          ) : blueprint ? (
            <>
              <View style={styles.analysisHero}><Icon name="business-outline" color={COLORS.sand} size={22} /><View style={styles.infoText}><Text style={styles.infoTitle}>{blueprint.name}</Text><Text style={styles.infoBody}>{blueprint.totalBlocks} total blocks · {blueprint.materials.length} material types</Text></View></View>
              <View style={styles.dimensionRow}><View><Text style={styles.telemetryLabel}>WIDTH</Text><Text style={styles.dimensionValue}>{blueprint.dimensions.width}</Text></View><View><Text style={styles.telemetryLabel}>HEIGHT</Text><Text style={styles.dimensionValue}>{blueprint.dimensions.height}</Text></View><View><Text style={styles.telemetryLabel}>LENGTH</Text><Text style={styles.dimensionValue}>{blueprint.dimensions.length}</Text></View></View>
              <View style={styles.materialList}>{blueprint.materials.slice(0, 6).map((material) => <View key={material.block} style={styles.materialRow}><Text style={styles.materialName}>{material.block.replace("minecraft:", "")}</Text><Text style={styles.materialQuantity}>{material.quantity} · {material.stacks} stack{material.stacks === 1 ? "" : "s"}</Text></View>)}</View>
              {buildStage === "land" ? (
                <>
                  <View style={styles.landBox}><Icon name="locate-outline" color={COLORS.sand} size={20} /><View style={styles.infoText}><Text style={styles.infoTitle}>Allotted land</Text><Text style={styles.infoBody}>In Minecraft, mark two opposite corners of the area where this structure should stand.</Text></View></View>
                  <Pressable accessibilityRole="button" onPress={confirmLand} style={styles.sheetPrimaryButton}><Text style={styles.sheetPrimaryText}>LAND IS MARKED</Text><Icon name="arrow-forward" color={COLORS.background} size={18} /></Pressable>
                </>
              ) : (
                <>
                  <View style={styles.landBox}><Icon name="checkmark-circle" color={COLORS.moss} size={20} /><View style={styles.infoText}><Text style={styles.infoTitle}>Allotted land confirmed</Text><Text style={styles.infoBody}>The build order is ready. BlockMate will ask for final confirmation before starting.</Text></View></View>
                  <Pressable accessibilityRole="button" onPress={openBuildAssist} style={styles.sheetSecondaryButton}><Text style={styles.sheetSecondaryText}>OPEN SIDE-BY-SIDE GUIDE</Text></Pressable>
                  <Pressable accessibilityRole="button" onPress={() => setBuildingVisible(false)} style={styles.sheetPrimaryButton}><Text style={styles.sheetPrimaryText}>PREPARE BUILD</Text><Icon name="checkmark" color={COLORS.background} size={18} /></Pressable>
                </>
              )}
              <Pressable accessibilityRole="button" onPress={() => void chooseBlueprint()} style={styles.sheetSecondaryButton}><Text style={styles.sheetSecondaryText}>CHOOSE A DIFFERENT FILE</Text></Pressable>
            </>
          ) : null}
        </Sheet>
      ) : null}

      {buildAssistVisible && blueprint ? (
        <Sheet onClose={() => setBuildAssistVisible(false)}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetTitleRow}>
            <View><Text style={styles.sheetEyebrow}>BUILD ASSIST / MANUAL</Text><Text style={styles.sheetTitle}>Side-by-side guide</Text></View>
            <Pressable onPress={() => setBuildAssistVisible(false)}><Icon name="close" color={COLORS.muted} size={24} /></Pressable>
          </View>
          <View style={styles.guideStatusRow}>
            <View style={styles.guideStatusBadge}><Icon name="phone-portrait-outline" color={COLORS.sand} size={15} /><Text style={styles.guideStatusText}>KEEP MINECRAFT BESIDE THIS GUIDE</Text></View>
            <Text style={styles.guidePercent}>{assistProgress}%</Text>
          </View>
          <Text style={styles.sheetBody}>This is a manual companion view. It never places a block or changes Minecraft. Use the layer and next-block prompts while Minecraft is visible beside or behind BlockMate.</Text>
          <View style={styles.guidePreview}>
            <View style={styles.guidePreviewHeader}><Text style={styles.formatBoxTitle}>LAYER {assistLayerIndex + 1} / {Math.max(blueprintLayers.length, 1)}</Text><Text style={styles.guidePreviewMeta}>{currentLayerBlocks.length} blocks</Text></View>
            <View style={styles.guideGrid}>
              {Array.from({ length: 25 }, (_, index) => {
                const filled = index < Math.min(currentLayerBlocks.length, 25);
                return <View key={index} style={[styles.guideGridCell, filled && styles.guideGridCellFilled, { opacity: filled ? assistOpacity / 100 : 1 }]} />;
              })}
            </View>
            <Text style={styles.guidePreviewHint}>Schematic preview · {blueprint.dimensions.width}W × {blueprint.dimensions.length}L footprint</Text>
          </View>
          <View style={styles.layerControls}>
            <Pressable accessibilityRole="button" disabled={assistLayerIndex === 0} onPress={() => setAssistLayerIndex((value) => Math.max(0, value - 1))} style={[styles.layerButton, assistLayerIndex === 0 && styles.buttonDisabled]}><Icon name="chevron-back" color={COLORS.text} size={18} /></Pressable>
            <View style={styles.layerReadout}><Text style={styles.telemetryLabel}>CURRENT Y</Text><Text style={styles.layerValue}>{currentAssistLayer}</Text></View>
            <Pressable accessibilityRole="button" disabled={assistLayerIndex >= blueprintLayers.length - 1} onPress={() => setAssistLayerIndex((value) => Math.min(blueprintLayers.length - 1, value + 1))} style={[styles.layerButton, assistLayerIndex >= blueprintLayers.length - 1 && styles.buttonDisabled]}><Icon name="chevron-forward" color={COLORS.text} size={18} /></Pressable>
          </View>
          <View style={styles.nextBlockCard}>
            <View style={[styles.nextBlockSwatch, { backgroundColor: nextAssistBlock ? COLORS.sand : COLORS.moss }]} />
            <View style={styles.infoText}><Text style={styles.telemetryLabel}>NEXT BLOCK</Text><Text style={styles.nextBlockName}>{nextAssistBlock ? nextAssistBlock.block.replace("minecraft:", "") : "Layer complete"}</Text><Text style={styles.infoBody}>{nextAssistBlock ? `Relative position  X ${nextAssistBlock.x} · Y ${nextAssistBlock.y} · Z ${nextAssistBlock.z}` : "All blueprint blocks are marked placed."}</Text></View>
          </View>
          <View style={styles.guideSliderRow}><Text style={styles.telemetryLabel}>OVERLAY OPACITY</Text><View style={styles.opacityRail}>{[30, 50, 70, 90].map((value) => <Pressable key={value} accessibilityRole="button" onPress={() => setAssistOpacity(value)} style={[styles.opacityStop, value === assistOpacity && styles.opacityStopActive]}><Text style={styles.opacityStopText}>{value}</Text></Pressable>)}</View></View>
          <View style={styles.guideActions}><Pressable accessibilityRole="button" onPress={markAssistBlockPlaced} disabled={!nextAssistBlock} style={[styles.sheetPrimaryButton, !nextAssistBlock && styles.buttonDisabled, styles.guideActionPrimary]}><Text style={styles.sheetPrimaryText}>MARK BLOCK PLACED</Text><Icon name="checkmark" color={COLORS.background} size={18} /></Pressable><Pressable accessibilityRole="button" onPress={() => setAssistPlacedCount(0)} style={styles.sheetSecondaryButton}><Text style={styles.sheetSecondaryText}>RESET PROGRESS</Text></Pressable></View>
        </Sheet>
      ) : null}

      {calibrationVisible ? (
        <Sheet onClose={() => setCalibrationVisible(false)}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetTitleRow}><View><Text style={styles.sheetEyebrow}>SETUP / {calibrationStep} OF 3</Text><Text style={styles.sheetTitle}>Calibrate your controls</Text></View><Pressable onPress={() => setCalibrationVisible(false)}><Icon name="close" color={COLORS.muted} size={24} /></Pressable></View>
          <Text style={styles.sheetBody}>Keep Minecraft visible in landscape at 2400×1080. Complete each check so the native bridge knows where to look and where to tap.</Text>
          <View style={styles.bridgeBox}>
            <View style={styles.bridgeBoxHeader}>
              <Icon name={bridgeStatus?.serviceEnabled ? "checkmark-circle" : "hardware-chip-outline"} color={bridgeStatus?.serviceEnabled ? COLORS.moss : COLORS.sand} size={18} />
              <Text style={styles.bridgeBoxTitle}>{bridgeStatus?.serviceEnabled ? "Accessibility service detected" : "Android bridge setup"}</Text>
            </View>
            <Text style={styles.bridgeBoxDetail}>{bridgeStatus?.serviceEnabled ? `${bridgeStatus.displayWidth}×${bridgeStatus.displayHeight} display · ${bridgeStatus.lastStatus}` : "The custom APK must be granted Accessibility access before it can send a gesture."}</Text>
            <View style={styles.bridgeBoxActions}>
              <Pressable accessibilityRole="button" onPress={openNativeAccessibilitySettings} style={styles.bridgeButton}><Text style={styles.bridgeButtonText}>OPEN SETTINGS</Text></Pressable>
              <Pressable accessibilityRole="button" onPress={() => void refreshBridgeStatus()} style={styles.bridgeButton}><Text style={styles.bridgeButtonText}>REFRESH</Text></Pressable>
            </View>
            <View style={styles.bridgeBoxHeader}>
              <Icon name={screenCaptureStatus?.lastStatus === "screen_capture_ready" ? "checkmark-circle" : "scan-outline"} color={screenCaptureStatus?.lastStatus === "screen_capture_ready" ? COLORS.moss : COLORS.blue} size={18} />
              <Text style={styles.bridgeBoxTitle}>{screenCaptureStatus?.lastStatus === "screen_capture_ready" ? "Screen frame ready" : "Screen recognition"}</Text>
            </View>
            <Text style={styles.bridgeBoxDetail}>{screenCaptureStatus?.lastStatus === "screen_capture_ready" ? `${screenCaptureStatus.width}×${screenCaptureStatus.height} local frame saved` : "Capture one Minecraft frame with Android’s visible consent prompt. No hidden recording."}</Text>
            <View style={styles.bridgeBoxActions}>
              <Pressable accessibilityRole="button" onPress={() => void captureMinecraftScreen()} style={styles.bridgeButton}><Text style={styles.bridgeButtonText}>CAPTURE ONE FRAME</Text></Pressable>
              <Pressable accessibilityRole="button" onPress={() => void refreshScreenCaptureStatus()} style={styles.bridgeButton}><Text style={styles.bridgeButtonText}>REFRESH</Text></Pressable>
            </View>
          </View>
          <View style={styles.calibrationSteps}>
            {[
              ["Touch layout", "Confirm the movement pad and action button are visible."],
              ["Screen regions", "Keep the health, hotbar, and inventory areas on screen."],
              ["Farm anchor", "Stand at the first crop row with a tool selected."],
            ].map(([title, body], index) => {
              const checked = calibrationChecks[index];
              return (
                <Pressable key={title} onPress={() => setCalibrationChecks((previous) => previous.map((value, itemIndex) => itemIndex === index ? !value : value))} style={styles.calibrationStepRow}>
                  <View style={[styles.checkBox, checked && styles.checkBoxChecked]}>{checked ? <Icon name="checkmark" color={COLORS.background} size={16} /> : <Text style={styles.checkNumber}>{index + 1}</Text>}</View>
                  <View style={styles.infoText}><Text style={styles.infoTitle}>{title}</Text><Text style={styles.infoBody}>{body}</Text></View>
                </Pressable>
              );
            })}
          </View>
          <Pressable accessibilityRole="button" disabled={!calibrationChecks.every(Boolean)} onPress={() => calibrationStep < 3 ? setCalibrationStep((value) => value + 1) : completeCalibration()} style={({ pressed }) => [styles.sheetPrimaryButton, !calibrationChecks.every(Boolean) && styles.buttonDisabled, { opacity: pressed ? 0.82 : 1 }]}>
            <Text style={styles.sheetPrimaryText}>{calibrationStep < 3 ? "NEXT CHECK" : "SAVE CALIBRATION"}</Text>
            <Icon name={calibrationStep < 3 ? "arrow-forward" : "checkmark"} color={COLORS.background} size={18} />
          </Pressable>
        </Sheet>
      ) : null}

      {confirmVisible ? (
        <Sheet onClose={() => setConfirmVisible(false)}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetIcon}><Icon name={selectedMode === "build" ? "business-outline" : "leaf-outline"} color={selectedMode === "build" ? COLORS.sand : COLORS.moss} size={30} /></View>
          <Text style={styles.sheetEyebrow}>{selectedMode === "build" ? "START BLUEPRINT BUILD" : "START FARMING LOOP"}</Text>
          <Text style={styles.sheetTitle}>Ready to send {selectedMode === "build" ? blueprint?.totalBlocks ?? 0 : currentLimit} {selectedMode === "build" ? "blocks" : "actions"}?</Text>
          <Text style={styles.sheetBody}>{selectedMode === "build" ? "Keep the confirmed allotted land and calibrated Minecraft view visible. BlockMate will stop if the screen, inventory, or safety state changes." : "Keep your prepared farm and the calibrated Minecraft view visible. BlockMate will pause the prototype loop if a safety signal changes."}</Text>
          <View style={styles.confirmBox}><Text style={styles.confirmBoxLabel}>LIMIT</Text><Text style={styles.confirmBoxValue}>{currentLimit} <Text style={styles.confirmBoxUnit}>{mode.unit}</Text></Text><Text style={styles.confirmBoxHint}>Safe default · emergency STOP stays available</Text></View>
          <Pressable accessibilityRole="button" onPress={() => void confirmStart()} style={({ pressed }) => [styles.sheetPrimaryButton, { opacity: pressed ? 0.82 : 1 }]}><Text style={styles.sheetPrimaryText}>{selectedMode === "build" ? "START BUILD SEQUENCE" : "START PROTOTYPE LOOP"}</Text><Icon name="play" color={COLORS.background} size={18} /></Pressable>
          <Pressable accessibilityRole="button" onPress={() => setConfirmVisible(false)} style={styles.sheetSecondaryButton}><Text style={styles.sheetSecondaryText}>NOT YET</Text></Pressable>
        </Sheet>
      ) : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 18, paddingTop: 18, paddingBottom: 34, gap: 18 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  logo: { width: 42, height: 42, borderRadius: 12 },
  wordmark: { color: COLORS.text, fontSize: 20, fontWeight: "800", letterSpacing: -0.5 },
  eyebrow: { color: COLORS.muted, fontSize: 9, fontWeight: "800", letterSpacing: 1.3, marginTop: 2 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  previewTag: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 9, paddingVertical: 7, borderRadius: 99, backgroundColor: COLORS.panel, borderWidth: 1, borderColor: COLORS.line },
  previewDot: { width: 6, height: 6, borderRadius: 99, backgroundColor: COLORS.moss },
  previewText: { color: COLORS.muted, fontSize: 9, fontWeight: "800", letterSpacing: 0.8 },
  headerButton: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.panel },
  heroRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", paddingTop: 8 },
  heroCopy: { flex: 1, paddingRight: 16 },
  heroKicker: { color: COLORS.moss, fontSize: 10, fontWeight: "800", letterSpacing: 1.8, marginBottom: 8 },
  heroTitle: { color: COLORS.text, fontSize: 32, lineHeight: 34, fontWeight: "800", letterSpacing: -1.3 },
  heroBody: { color: COLORS.muted, fontSize: 13, lineHeight: 19, marginTop: 10, maxWidth: 270 },
  heroBadge: { width: 76, height: 84, borderRadius: 20, backgroundColor: `${COLORS.moss}12`, borderWidth: 1, borderColor: `${COLORS.moss}42`, alignItems: "center", justifyContent: "center", gap: 6 },
  heroBadgeText: { color: COLORS.moss, fontSize: 10, lineHeight: 11, fontWeight: "900", letterSpacing: 1.3, textAlign: "center" },
  statusCard: { backgroundColor: COLORS.panel, borderRadius: 20, borderWidth: 1, borderColor: COLORS.line, padding: 16 },
  statusCardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  cardEyebrow: { color: COLORS.muted, fontSize: 9, fontWeight: "800", letterSpacing: 1.5, marginBottom: 6 },
  statusTitle: { color: COLORS.text, fontSize: 19, fontWeight: "800", letterSpacing: -0.3 },
  statePill: { flexDirection: "row", alignItems: "center", gap: 6, borderWidth: 1, borderRadius: 99, paddingHorizontal: 9, paddingVertical: 7 },
  statePillText: { fontSize: 10, fontWeight: "800", letterSpacing: 0.5 },
  statusDivider: { height: 1, backgroundColor: COLORS.line, marginVertical: 14 },
  statusTelemetry: { flexDirection: "row", justifyContent: "space-between" },
  telemetryBlock: { flex: 1 },
  telemetryBlockRight: { alignItems: "flex-end" },
  telemetryLabel: { color: COLORS.muted, fontSize: 9, fontWeight: "800", letterSpacing: 1.2, marginBottom: 5 },
  telemetryValue: { color: COLORS.text, fontSize: 13, fontWeight: "700" },
  progressTrack: { height: 6, borderRadius: 99, backgroundColor: COLORS.background, overflow: "hidden", marginTop: 14 },
  progressFill: { height: "100%", backgroundColor: COLORS.moss, borderRadius: 99 },
  toast: { color: COLORS.muted, fontSize: 11, lineHeight: 16, marginTop: 10 },
  sectionLabelRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 2 },
  sectionLabel: { color: COLORS.text, fontSize: 10, fontWeight: "900", letterSpacing: 1.4 },
  sectionLabelRight: { color: COLORS.muted, fontSize: 9, fontWeight: "800", letterSpacing: 1.1 },
  modeRail: { gap: 10, paddingRight: 10 },
  modeCard: { width: 96, height: 100, borderRadius: 16, backgroundColor: COLORS.panel, borderWidth: 1, padding: 11, justifyContent: "space-between" },
  modeCardSelected: { backgroundColor: COLORS.panelRaised },
  modeIcon: { width: 34, height: 34, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  modeCardLabel: { color: COLORS.muted, fontSize: 13, fontWeight: "800" },
  modeCardStatus: { flexDirection: "row", alignItems: "center", gap: 5 },
  statusDot: { width: 5, height: 5, borderRadius: 99 },
  modeCardStatusText: { color: COLORS.muted, fontSize: 8, fontWeight: "900", letterSpacing: 0.8 },
  modePanel: { backgroundColor: COLORS.panel, borderRadius: 20, borderWidth: 1, padding: 16, gap: 15 },
  modePanelHeader: { flexDirection: "row", gap: 12 },
  largeModeIcon: { width: 52, height: 52, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  modePanelTitleWrap: { flex: 1 },
  titleLine: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 7 },
  modePanelTitle: { color: COLORS.text, fontSize: 17, fontWeight: "800", flexShrink: 1 },
  inlineStatus: { paddingHorizontal: 6, paddingVertical: 3, borderRadius: 99 },
  inlineStatusText: { fontSize: 8, fontWeight: "900", letterSpacing: 0.8 },
  modePanelBody: { color: COLORS.muted, fontSize: 12, lineHeight: 17, marginTop: 5 },
  blueprintSummary: { backgroundColor: COLORS.background, borderRadius: 14, borderWidth: 1, borderColor: COLORS.line, padding: 12, gap: 10 },
  blueprintSummaryTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  blueprintDimensions: { color: COLORS.sand, fontSize: 11, fontWeight: "800" },
  blueprintButton: { minHeight: 42, borderRadius: 12, backgroundColor: COLORS.sand, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  blueprintButtonText: { color: COLORS.background, fontSize: 10, fontWeight: "900", letterSpacing: 0.8 },
  guideButton: { minHeight: 40, borderRadius: 12, borderWidth: 1, borderColor: `${COLORS.sand}66`, backgroundColor: `${COLORS.sand}12`, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  guideButtonText: { color: COLORS.sand, fontSize: 10, fontWeight: "900", letterSpacing: 0.8 },
  settingRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingTop: 3 },
  settingLabel: { color: COLORS.text, fontSize: 11, fontWeight: "900", letterSpacing: 1.1 },
  settingHint: { color: COLORS.muted, fontSize: 10, marginTop: 4 },
  stepper: { flexDirection: "row", alignItems: "center", gap: 7 },
  stepperButton: { width: 34, height: 34, borderRadius: 10, backgroundColor: COLORS.panelSoft, alignItems: "center", justifyContent: "center" },
  stepperValueWrap: { alignItems: "center", minWidth: 48 },
  stepperValue: { color: COLORS.text, fontSize: 17, fontWeight: "900" },
  stepperUnit: { color: COLORS.muted, fontSize: 8, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.6 },
  calibrationRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 14, borderTopWidth: 1, borderTopColor: COLORS.line },
  calibrationCopy: { flexDirection: "row", alignItems: "center", gap: 9, flex: 1 },
  calibrationTitle: { color: COLORS.text, fontSize: 12, fontWeight: "800" },
  calibrationDetail: { color: COLORS.muted, fontSize: 10, marginTop: 3 },
  textButton: { paddingHorizontal: 8, paddingVertical: 8 },
  textButtonText: { color: COLORS.sand, fontSize: 10, fontWeight: "900", letterSpacing: 0.8 },
  plannedNotice: { flexDirection: "row", gap: 9, backgroundColor: COLORS.background, borderRadius: 12, padding: 11, alignItems: "flex-start" },
  plannedNoticeText: { color: COLORS.muted, flex: 1, fontSize: 11, lineHeight: 15 },
  safetyPanel: { flexDirection: "row", gap: 8 },
  safetyChip: { flex: 1, backgroundColor: COLORS.panel, borderRadius: 14, borderWidth: 1, borderColor: COLORS.line, padding: 11 },
  safetyChipTop: { flexDirection: "row", alignItems: "center", gap: 6 },
  safetyDot: { width: 6, height: 6, borderRadius: 99 },
  safetyChipLabel: { color: COLORS.muted, fontSize: 9, fontWeight: "900", letterSpacing: 0.8 },
  safetyChipValue: { fontSize: 17, fontWeight: "900", marginTop: 8 },
  safetyChipDetail: { color: COLORS.muted, fontSize: 9, lineHeight: 13, marginTop: 3 },
  disclaimer: { color: COLORS.muted, fontSize: 10, lineHeight: 15, paddingHorizontal: 3 },
  bridgeBox: { backgroundColor: COLORS.background, borderRadius: 14, borderWidth: 1, borderColor: COLORS.line, padding: 12, gap: 8 },
  bridgeBoxHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  bridgeBoxTitle: { color: COLORS.text, fontSize: 12, fontWeight: "800" },
  bridgeBoxDetail: { color: COLORS.muted, fontSize: 10, lineHeight: 15 },
  bridgeBoxActions: { flexDirection: "row", gap: 8 },
  bridgeButton: { backgroundColor: COLORS.panelSoft, borderRadius: 9, paddingHorizontal: 10, paddingVertical: 8 },
  bridgeButtonText: { color: COLORS.sand, fontSize: 9, fontWeight: "900", letterSpacing: 0.7 },
  controlShelf: { flexDirection: "row", gap: 10, paddingTop: 4 },
  stopButton: { width: 76, minHeight: 56, borderRadius: 16, backgroundColor: COLORS.coral, alignItems: "center", justifyContent: "center", gap: 2 },
  stopButtonText: { color: COLORS.white, fontSize: 10, fontWeight: "900", letterSpacing: 1.2 },
  startButton: { flex: 1, minHeight: 56, borderRadius: 16, backgroundColor: COLORS.moss, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 9 },
  startButtonText: { color: COLORS.background, fontSize: 12, fontWeight: "900", letterSpacing: 0.7 },
  buttonDisabled: { backgroundColor: COLORS.line },
  modalBackdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: "#00000099" },
  sheet: { backgroundColor: COLORS.panel, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 26, borderWidth: 1, borderColor: COLORS.line, gap: 14 },
  sheetHandle: { width: 42, height: 4, borderRadius: 99, backgroundColor: COLORS.line, alignSelf: "center", marginBottom: 5 },
  sheetIcon: { width: 58, height: 58, borderRadius: 18, backgroundColor: `${COLORS.moss}18`, alignItems: "center", justifyContent: "center" },
  sheetEyebrow: { color: COLORS.moss, fontSize: 10, fontWeight: "900", letterSpacing: 1.4 },
  sheetTitle: { color: COLORS.text, fontSize: 25, lineHeight: 29, fontWeight: "900", letterSpacing: -0.7 },
  sheetBody: { color: COLORS.muted, fontSize: 13, lineHeight: 19 },
  formatBox: { backgroundColor: COLORS.background, borderWidth: 1, borderColor: COLORS.line, borderRadius: 14, padding: 12, gap: 7 },
  formatBoxTitle: { color: COLORS.sand, fontSize: 9, fontWeight: "900", letterSpacing: 1.1 },
  formatBoxBody: { color: COLORS.muted, fontSize: 11, lineHeight: 15 },
  formatCode: { color: COLORS.text, fontSize: 10, lineHeight: 15, fontFamily: "monospace" },
  analysisHero: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: COLORS.background, borderRadius: 14, padding: 12 },
  dimensionRow: { flexDirection: "row", justifyContent: "space-between", backgroundColor: COLORS.background, borderRadius: 14, padding: 14 },
  dimensionValue: { color: COLORS.sand, fontSize: 24, fontWeight: "900", marginTop: 3 },
  materialList: { backgroundColor: COLORS.background, borderRadius: 14, paddingHorizontal: 12 },
  materialRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: COLORS.line },
  materialName: { color: COLORS.text, fontSize: 11, fontWeight: "700" },
  materialQuantity: { color: COLORS.muted, fontSize: 10, fontWeight: "800" },
  landBox: { flexDirection: "row", gap: 10, alignItems: "flex-start", backgroundColor: `${COLORS.sand}12`, borderRadius: 14, padding: 12 },
  infoList: { gap: 12, paddingVertical: 3 },
  infoItem: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  infoBullet: { width: 23, height: 23, borderRadius: 8, backgroundColor: `${COLORS.moss}18`, alignItems: "center", justifyContent: "center" },
  infoText: { flex: 1 },
  infoTitle: { color: COLORS.text, fontSize: 12, fontWeight: "800" },
  infoBody: { color: COLORS.muted, fontSize: 11, lineHeight: 16, marginTop: 2 },
  sheetPrimaryButton: { minHeight: 54, borderRadius: 15, backgroundColor: COLORS.moss, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 9, marginTop: 2 },
  sheetPrimaryText: { color: COLORS.background, fontSize: 11, fontWeight: "900", letterSpacing: 0.8 },
  sheetSecondaryButton: { alignItems: "center", paddingVertical: 10 },
  sheetSecondaryText: { color: COLORS.muted, fontSize: 10, fontWeight: "900", letterSpacing: 1.1 },
  sheetTitleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  calibrationSteps: { gap: 8 },
  calibrationStepRow: { flexDirection: "row", alignItems: "center", gap: 11, backgroundColor: COLORS.background, borderRadius: 14, padding: 11 },
  checkBox: { width: 28, height: 28, borderRadius: 9, borderWidth: 1, borderColor: COLORS.line, alignItems: "center", justifyContent: "center" },
  checkBoxChecked: { backgroundColor: COLORS.moss, borderColor: COLORS.moss },
  checkNumber: { color: COLORS.muted, fontSize: 12, fontWeight: "900" },
  confirmBox: { backgroundColor: COLORS.background, borderRadius: 15, borderWidth: 1, borderColor: COLORS.line, padding: 14 },
  confirmBoxLabel: { color: COLORS.muted, fontSize: 9, fontWeight: "900", letterSpacing: 1.2 },
  confirmBoxValue: { color: COLORS.moss, fontSize: 29, fontWeight: "900", marginTop: 4 },
  confirmBoxUnit: { color: COLORS.muted, fontSize: 12, fontWeight: "800" },
  confirmBoxHint: { color: COLORS.muted, fontSize: 10, marginTop: 2 },
  guideStatusRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  guideStatusBadge: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: `${COLORS.sand}12`, borderRadius: 99, paddingHorizontal: 9, paddingVertical: 7 },
  guideStatusText: { color: COLORS.sand, fontSize: 9, fontWeight: "900", letterSpacing: 0.7 },
  guidePercent: { color: COLORS.moss, fontSize: 20, fontWeight: "900" },
  guidePreview: { backgroundColor: COLORS.background, borderRadius: 16, borderWidth: 1, borderColor: COLORS.line, padding: 12, gap: 10 },
  guidePreviewHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  guidePreviewMeta: { color: COLORS.muted, fontSize: 10, fontWeight: "800" },
  guideGrid: { flexDirection: "row", flexWrap: "wrap", gap: 4, width: 190, alignSelf: "center" },
  guideGridCell: { width: 32, height: 22, borderRadius: 5, backgroundColor: COLORS.panelSoft, borderWidth: 1, borderColor: COLORS.line },
  guideGridCellFilled: { backgroundColor: COLORS.sand, borderColor: COLORS.sand },
  guidePreviewHint: { color: COLORS.muted, fontSize: 10, lineHeight: 14, textAlign: "center" },
  layerControls: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  layerButton: { width: 42, height: 42, borderRadius: 12, backgroundColor: COLORS.panelSoft, alignItems: "center", justifyContent: "center" },
  layerReadout: { alignItems: "center" },
  layerValue: { color: COLORS.sand, fontSize: 22, fontWeight: "900", marginTop: 2 },
  nextBlockCard: { flexDirection: "row", alignItems: "center", gap: 11, backgroundColor: `${COLORS.moss}0D`, borderRadius: 14, borderWidth: 1, borderColor: `${COLORS.moss}44`, padding: 12 },
  nextBlockSwatch: { width: 24, height: 24, borderRadius: 7 },
  nextBlockName: { color: COLORS.text, fontSize: 15, fontWeight: "900", marginTop: 2 },
  guideSliderRow: { gap: 8 },
  opacityRail: { flexDirection: "row", gap: 7 },
  opacityStop: { flex: 1, backgroundColor: COLORS.panelSoft, borderRadius: 8, paddingVertical: 8, alignItems: "center" },
  opacityStopActive: { backgroundColor: `${COLORS.sand}33`, borderWidth: 1, borderColor: COLORS.sand },
  opacityStopText: { color: COLORS.muted, fontSize: 10, fontWeight: "900" },
  guideActions: { gap: 4 },
  guideActionPrimary: { marginTop: 0 },
});
