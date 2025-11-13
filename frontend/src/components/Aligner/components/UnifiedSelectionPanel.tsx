import React from "react";
import { useInstance, useTextInstances } from "../../../hooks/useTextData";
import { useTextSelectionStore } from "../../../stores/textSelectionStore";
import { useSearchParams } from "react-router-dom";
import { CATALOGER_URL } from "../../../config";
import LoadingOverlay from "./LoadingOverlay";
import { BdrcSearchPanel } from "./BdrcSearchPanel";
import { SelectedTextDisplay } from "./SelectedTextDisplay";
import { InstanceSelector } from "./InstanceSelector";
import { RelatedInstancesPanel } from "./RelatedInstancesPanel";
import { useAlignmentSegmentation } from "../hooks/useAlignmentSegmentation";
import { useBdrcTextSelection } from "../hooks/useBdrcTextSelection";
import { useRelatedInstances } from "../hooks/useRelatedInstances";
import {
  fetchAnnotation,
  fetchInstance,
} from "../../../api/text";
import { fetchRelatedInstances } from "../../../api/instances";
import {
  applySegmentation,
  generateFileSegmentation,
  extractInstanceSegmentation,
} from "../../../lib/annotation";
import { reconstructSegments } from "../utils/generateAnnotation";
import type { OpenPechaTextInstance } from "../../../types/text";

function UnifiedSelectionPanel() {
  const {
    sourceInstanceId,
    sourceTextId,
    targetInstanceId,
    isSourceLoaded,
    isTargetLoaded,
    setSourceSelection,
    isLoadingAnnotations,
    loadingMessage,
    setSourceText,
    setTargetText,
    setLoadingAnnotations,
    setAnnotationsApplied,
  } = useTextSelectionStore();

  // Source selection state
  const [selectedTextId, setSelectedTextId] = React.useState<string>(
    sourceTextId || ""
  );
  const [selectedInstanceId, setSelectedInstanceId] = React.useState<
    string | null
  >(sourceInstanceId || null);

  // Target selection state
  const [selectedTargetInstanceId, setSelectedTargetInstanceId] =
    React.useState<string | null>(targetInstanceId || null);
  const [selectedAnnotationId, setSelectedAnnotationId] = React.useState<
    string | null
  >(null);

  const [searchParams, setSearchParams] = useSearchParams();

  // BDRC search hook
  const {
    bdrcSearchQuery,
    setBdrcSearchQuery,
    selectedBdrcResult,
    showBdrcResults,
    setShowBdrcResults,
    bdrcTextNotFound,
    isCheckingBdrcText,
    fetchedTexts,
    handleBdrcResultSelect: handleBdrcResultSelectBase,
    handleResetBdrcSelection: handleResetBdrcSelectionBase,
    hasSelectedText,
  } = useBdrcTextSelection();

  // React Query hooks for source
  const {
    data: instancesData,
    isLoading: isLoadingInstances,
    error: instancesError,
  } = useTextInstances(selectedTextId);
  const {
    data: instanceData,
    isLoading: isLoadingInstance,
    error: instanceError,
  } = useInstance(selectedInstanceId);

  // React Query hooks for target
  const { data: relatedInstances = [] } = useRelatedInstances(sourceInstanceId);

  // Available instances for source
  const availableInstances = React.useMemo(() => {
    return Array.isArray(instancesData) ? instancesData : [];
  }, [instancesData]);

  // Sync local state with store state
  React.useEffect(() => {
    setSelectedTextId(sourceTextId || "");
    setSelectedInstanceId(sourceInstanceId || null);
    setSelectedTargetInstanceId(targetInstanceId || null);
  }, [sourceTextId, sourceInstanceId, targetInstanceId]);

  // Update source selection in store (but don't update URL params automatically)
  React.useEffect(() => {
    if (!instanceData || !selectedInstanceId || !selectedTextId) return;

    try {
      setSourceSelection(selectedTextId, selectedInstanceId);
      // Don't update URL params automatically - only update when user explicitly selects
    } catch (error) {
      console.error("Error updating source parameters:", error);
    }
  }, [instanceData, selectedInstanceId, selectedTextId, setSourceSelection]);

  // Track if we've loaded from URL to prevent re-loading
  const [hasLoadedFromUrl, setHasLoadedFromUrl] = React.useState(false);

  // Load texts from URL parameters on mount
  React.useEffect(() => {
    const urlSourceId = searchParams.get("s_id");
    const urlTargetId = searchParams.get("t_id");
    // Only load if we have URL params, haven't loaded yet, and texts aren't already loaded
    console.log(urlSourceId, urlTargetId, hasLoadedFromUrl, isSourceLoaded, isTargetLoaded)
    if (
      (urlSourceId || urlTargetId) &&
      !isSourceLoaded &&
      !isTargetLoaded
    ) {
console.log('loading from url')
      const loadFromUrl = async () => {
        try {
          setHasLoadedFromUrl(true);
          setLoadingAnnotations(true, "Loading from URL parameters...");

          if (!urlSourceId) {
            console.error("Source instance ID (s_id) is required");
            setLoadingAnnotations(false);
            return;
          }

          // Fetch the source instance
          const sourceInstanceData = await fetchInstance(urlSourceId);
          
          // Try to get text_id from instance response (might be in response even if not in type)
          let sourceTextIdFromInstance: string = urlSourceId; // Default fallback
          
          // Check if text_id exists in the response (even if not in type definition)
          interface InstanceWithTextId extends OpenPechaTextInstance {
            text_id?: string;
          }
          const instanceWithTextId = sourceInstanceData as InstanceWithTextId;
          if (instanceWithTextId.text_id && typeof instanceWithTextId.text_id === 'string') {
            sourceTextIdFromInstance = instanceWithTextId.text_id;
          }
          
          // Set source selection
          setSelectedTextId(sourceTextIdFromInstance);
          setSelectedInstanceId(urlSourceId);
          setSourceSelection(sourceTextIdFromInstance, urlSourceId);

          // If target ID is provided, fetch related instances and load alignment
          if (urlTargetId) {
            // Fetch related instances for the source instance
            const relatedInstancesList = await fetchRelatedInstances(urlSourceId);

            // Find the target instance in related instances
            const targetInstance = relatedInstancesList.find(
              (instance) => (instance.instance_id || instance.id) === urlTargetId
            );

            if (!targetInstance) {
              console.error("Target instance not found in related instances");
              setLoadingAnnotations(false);
              return;
            }

            // Check if target instance has alignment annotation
            // Match the logic from RelatedInstancesPanel.getInstanceMetadata
            let annotationId: string | null = null;
            let hasAlignment = false;
            
            // Check for new format (has 'annotation' property as string)
            if (
              "annotation" in targetInstance &&
              typeof targetInstance.annotation === "string" &&
              targetInstance.annotation
            ) {
              annotationId = targetInstance.annotation;
              hasAlignment = true;
            } 
            // Check for old format (has 'annotations' array)
            else if (
              targetInstance.annotations &&
              Array.isArray(targetInstance.annotations)
            ) {
              // Look for alignment type annotation
              const alignmentAnn = targetInstance.annotations.find(
                (ann) => ann.type === "alignment"
              );
              if (alignmentAnn?.annotation_id) {
                annotationId = alignmentAnn.annotation_id;
                hasAlignment = true;
              }
            }
            // Also check if annotations is an object (old format from instance annotations)
            else if (
              targetInstance.annotations &&
              typeof targetInstance.annotations === "object" &&
              !Array.isArray(targetInstance.annotations)
            ) {
              // Check if any annotation has type === 'alignment'
              const annotationsObj = targetInstance.annotations as Record<string, unknown[]>;
              const hasAlignmentAnnotation = Object.values(annotationsObj).some((annArray) =>
                Array.isArray(annArray) &&
                annArray.some(
                  (ann: unknown) =>
                    typeof ann === "object" &&
                    ann !== null &&
                    "type" in ann &&
                    (ann as { type: string }).type === "alignment"
                )
              );
              
              if (hasAlignmentAnnotation) {
                // Try to extract annotation ID from alignment annotation
                for (const annArray of Object.values(annotationsObj)) {
                  if (Array.isArray(annArray)) {
                    const alignmentAnn = annArray.find(
                      (ann: unknown) =>
                        typeof ann === "object" &&
                        ann !== null &&
                        "type" in ann &&
                        (ann as { type: string }).type === "alignment" &&
                        "annotation_id" in ann
                    );
                    if (alignmentAnn && typeof alignmentAnn === "object" && "annotation_id" in alignmentAnn) {
                      annotationId = (alignmentAnn as { annotation_id: string }).annotation_id;
                      hasAlignment = true;
                      break;
                    }
                  }
                }
              }
            }

            setSelectedTargetInstanceId(urlTargetId);
            setSelectedAnnotationId(annotationId);

            if (hasAlignment && annotationId) {
              // Load alignment annotation
              setLoadingAnnotations(true, "Fetching alignment annotation...");

              try {
                // Fetch alignment annotation and both instances in parallel
                const [
                  alignmentAnnotationData,
                  sourceInstanceData,
                  targetInstanceData,
                ] = await Promise.all([
                  fetchAnnotation(annotationId),
                  fetchInstance(urlSourceId),
                  fetchInstance(urlTargetId),
                ]);

                // Extract alignment data from annotation response
                interface AlignmentAnnotationData {
                  alignment_annotation: Array<{
                    id: string;
                    span: {
                      start: number;
                      end: number;
                    };
                    index: number;
                    alignment_index: number[];
                  }>;
                  target_annotation: Array<{
                    id: string;
                    span: {
                      start: number;
                      end: number;
                    };
                    index: number;
                  }>;
                }

                interface AlignmentAnnotationResponse {
                  id: string;
                  type: string;
                  data: AlignmentAnnotationData;
                }

                const annotationData = (
                  alignmentAnnotationData as unknown as AlignmentAnnotationResponse
                ).data;

                if (
                  !annotationData?.target_annotation ||
                  !Array.isArray(annotationData.target_annotation) ||
                  !annotationData?.alignment_annotation ||
                  !Array.isArray(annotationData.alignment_annotation)
                ) {
                  console.error("Invalid alignment annotation structure");
                  setLoadingAnnotations(false);
                  return;
                }

                // Get text content
                const sourceContent = sourceInstanceData.content || "";
                const targetContent = targetInstanceData.content || "";

                // Reconstruct segments from alignment annotations
                const { source, target } = reconstructSegments(
                  annotationData.target_annotation,
                  annotationData.alignment_annotation,
                  sourceContent,
                  targetContent
                );

                // Join segments with newlines to create segmented text
                const segmentedSourceText = source.join("\n");
                const segmentedTargetText = target.join("\n");

                // Load the source and target on editor
                setSourceText(
                  sourceTextIdFromInstance,
                  urlSourceId,
                  segmentedSourceText,
                  "database"
                );

                setTargetText(
                  `related-${urlTargetId}`,
                  urlTargetId,
                  segmentedTargetText,
                  "database"
                );

                setAnnotationsApplied(true);
                setLoadingAnnotations(false);

                // Update search params
                setSearchParams((prev) => {
                  prev.set("s_id", urlSourceId);
                  prev.set("t_id", urlTargetId);
                  prev.delete("tTextId");
                  prev.delete("tInstanceId");
                  return prev;
                });
              } catch (error) {
                console.error("Error processing alignment annotation:", error);
                setLoadingAnnotations(false);
                setAnnotationsApplied(true);
              }
            } else {
              // No alignment - use segmentation
              setLoadingAnnotations(true, "Fetching segmentation annotations...");

              try {
                // Fetch both source and target instances
                const [sourceInstanceData, targetInstanceData] = await Promise.all([
                  fetchInstance(urlSourceId),
                  fetchInstance(urlTargetId),
                ]);

                // Helper function to extract segmentation annotation ID from instance
                const getSegmentationAnnotationId = (
                  instanceData: OpenPechaTextInstance
                ): string | null => {
                  if (
                    !instanceData?.annotations ||
                    typeof instanceData.annotations !== "object"
                  ) {
                    return null;
                  }

                  interface AnnotationWithId {
                    annotation_id?: string;
                    type?: string;
                  }

                  const annotation = Object.values(instanceData.annotations)
                    .flat()
                    .find(
                      (ann): ann is AnnotationWithId =>
                        ann !== null &&
                        typeof ann === "object" &&
                        "annotation_id" in ann &&
                        "type" in ann &&
                        (ann as AnnotationWithId).type === "segmentation"
                    );

                  return annotation?.annotation_id || null;
                };

                // Get segmentation annotation IDs
                const sourceSegmentationAnnotationId =
                  getSegmentationAnnotationId(sourceInstanceData);
                const targetSegmentationAnnotationId =
                  getSegmentationAnnotationId(targetInstanceData);

                // Fetch segmentation annotations if available
                let sourceSegmentation: Array<{
                  span: { start: number; end: number };
                }> | null = null;
                let targetSegmentation: Array<{
                  span: { start: number; end: number };
                }> | null = null;

                interface AnnotationResponse {
                  annotation?: Array<{ span: { start: number; end: number } }>;
                  data?: Array<{ span: { start: number; end: number } }>;
                }

                // Helper function to extract segmentation array from annotation response
                const extractSegmentationArray = (
                  annotationData: unknown
                ): Array<{ span: { start: number; end: number } }> | null => {
                  if (Array.isArray(annotationData)) {
                    return annotationData;
                  }

                  if (annotationData && typeof annotationData === "object") {
                    const response = annotationData as AnnotationResponse;
                    // Check for 'data' property first (new format)
                    if (response.data && Array.isArray(response.data)) {
                      return response.data;
                    }
                    // Check for 'annotation' property (legacy format)
                    if (response.annotation && Array.isArray(response.annotation)) {
                      return response.annotation;
                    }
                  }

                  return null;
                };

                if (sourceSegmentationAnnotationId) {
                  try {
                    const sourceAnnotationData = await fetchAnnotation(
                      sourceSegmentationAnnotationId
                    );
                    sourceSegmentation =
                      extractSegmentationArray(sourceAnnotationData);
                  } catch (error) {
                    console.warn(
                      "Failed to fetch source segmentation annotation:",
                      error
                    );
                  }
                }

                if (targetSegmentationAnnotationId) {
                  try {
                    const targetAnnotationData = await fetchAnnotation(
                      targetSegmentationAnnotationId
                    );
                    targetSegmentation =
                      extractSegmentationArray(targetAnnotationData);
                  } catch (error) {
                    console.warn(
                      "Failed to fetch target segmentation annotation:",
                      error
                    );
                  }
                }

                // If no segmentation annotation found, try extracting from instance annotations
                sourceSegmentation ??= extractInstanceSegmentation(
                  sourceInstanceData.annotations
                );
                targetSegmentation ??= extractInstanceSegmentation(
                  targetInstanceData.annotations
                );

                // Get text content
                const sourceContent = sourceInstanceData.content || "";
                const targetContent = targetInstanceData.content || "";

                // Apply segmentation to text
                let segmentedSourceText: string;
                let segmentedTargetText: string;

                if (sourceSegmentation && sourceSegmentation.length > 0) {
                  segmentedSourceText = applySegmentation(
                    sourceContent,
                    sourceSegmentation
                  );
                } else {
                  // Fallback to file segmentation if no instance segmentation
                  const sourceSegmentations = generateFileSegmentation(sourceContent);
                  segmentedSourceText = applySegmentation(
                    sourceContent,
                    sourceSegmentations
                  );
                }

                if (targetSegmentation && targetSegmentation.length > 0) {
                  segmentedTargetText = applySegmentation(
                    targetContent,
                    targetSegmentation
                  );
                } else {
                  // Fallback to file segmentation if no instance segmentation
                  const targetSegmentations = generateFileSegmentation(targetContent);
                  segmentedTargetText = applySegmentation(
                    targetContent,
                    targetSegmentations
                  );
                }

                // Load the source and target on editor
                setSourceText(
                  sourceTextIdFromInstance,
                  urlSourceId,
                  segmentedSourceText,
                  "database"
                );

                setTargetText(
                  `related-${urlTargetId}`,
                  urlTargetId,
                  segmentedTargetText,
                  "database"
                );

                setAnnotationsApplied(true);
                setLoadingAnnotations(false);

                // Update search params
                setSearchParams((prev) => {
                  prev.set("s_id", urlSourceId);
                  prev.set("t_id", urlTargetId);
                  prev.delete("tTextId");
                  prev.delete("tInstanceId");
                  return prev;
                });
              } catch (error) {
                console.error("Error processing segmentation:", error);
                setLoadingAnnotations(false);
                setAnnotationsApplied(true);
              }
            }
          }
        } catch (error) {
          console.error("Error loading source from URL parameters:", error);
          setHasLoadedFromUrl(false);
          setLoadingAnnotations(false);
        }
      };

      loadFromUrl();
    }
  }, [
    searchParams,
    hasLoadedFromUrl,
    isSourceLoaded,
    isTargetLoaded,
    setSourceSelection,
    setLoadingAnnotations,
    setSourceText,
    setTargetText,
    setAnnotationsApplied,
    setSearchParams,
    setSelectedTargetInstanceId,
    setSelectedAnnotationId,
  ]);

  // Handle BDRC result selection - wraps the hook handler to also set text ID
  const handleBdrcResultSelect = React.useCallback(
    async (result: { workId?: string }) => {
      const textId = await handleBdrcResultSelectBase(result);
      if (textId) {
        setSelectedTextId(textId);
        setSelectedInstanceId(null);
      }
    },
    [handleBdrcResultSelectBase]
  );

  // Handle resetting BDRC selection
  const handleResetBdrcSelection = React.useCallback(() => {
    handleResetBdrcSelectionBase();
    setSelectedTextId("");
    setSelectedInstanceId(null);
  }, [handleResetBdrcSelectionBase]);

  // Handle instance selection
  const handleInstanceSelection = React.useCallback(
    (instanceId: string) => {
      //set s_id in search params
      setSearchParams((prev) => {
        prev.set("s_id", instanceId);
        return prev;
      });
      if (!instanceId || !selectedTextId) return;
      setSelectedInstanceId(instanceId);
    },
    [selectedTextId]
  );

  // Handle action selection
  const handleActionSelection = React.useCallback(
    (action: "create-translation" | "create-commentary") => {
      if (!sourceTextId || !sourceInstanceId) {
        console.error("Source text ID and instance ID are required");
        return;
      }

      const actionType =
        action === "create-translation" ? "translation" : "commentary";
      const url = `${CATALOGER_URL}/texts/${sourceTextId}/instances/${sourceInstanceId}/${actionType}`;
      window.open(url, "_blank");
    },
    [sourceTextId, sourceInstanceId]
  );

  // Handle target instance selection
  const handleTargetInstanceSelection = React.useCallback(
    async (instanceId: string, hasAlignment: boolean) => {
      if (!instanceId) {
        setSelectedTargetInstanceId(null);
        setSelectedAnnotationId(null);
        return;
      }

      if (!hasAlignment) {
        // Get segmentation for both source and target instance
        // Fetch that segmentation annotation from fetchAnnotation for both source and target instance
        // Apply the segmentation to the text
        // Load the source and target on editor

        if (!sourceInstanceId) {
          console.error("Source instance ID is required");
          return;
        }

        setLoadingAnnotations(true, "Fetching segmentation annotations...");

        try {
          // Fetch both source and target instances
          const [sourceInstanceData, targetInstanceData] = await Promise.all([
            fetchInstance(sourceInstanceId),
            fetchInstance(instanceId),
          ]);

          // Helper function to extract segmentation annotation ID from instance
          const getSegmentationAnnotationId = (
            instanceData: OpenPechaTextInstance
          ): string | null => {
            if (
              !instanceData?.annotations ||
              typeof instanceData.annotations !== "object"
            ) {
              return null;
            }

            interface AnnotationWithId {
              annotation_id?: string;
              type?: string;
            }

            const annotation = Object.values(instanceData.annotations)
              .flat()
              .find(
                (ann): ann is AnnotationWithId =>
                  ann !== null &&
                  typeof ann === "object" &&
                  "annotation_id" in ann &&
                  "type" in ann &&
                  (ann as AnnotationWithId).type === "segmentation"
              );

            return annotation?.annotation_id || null;
          };

          // Get segmentation annotation IDs
          const sourceSegmentationAnnotationId =
            getSegmentationAnnotationId(sourceInstanceData);
          const targetSegmentationAnnotationId =
            getSegmentationAnnotationId(targetInstanceData);

          // Fetch segmentation annotations if available
          let sourceSegmentation: Array<{
            span: { start: number; end: number };
          }> | null = null;
          let targetSegmentation: Array<{
            span: { start: number; end: number };
          }> | null = null;

          interface AnnotationResponse {
            annotation?: Array<{ span: { start: number; end: number } }>;
            data?: Array<{ span: { start: number; end: number } }>;
          }

          // Helper function to extract segmentation array from annotation response
          const extractSegmentationArray = (
            annotationData: unknown
          ): Array<{ span: { start: number; end: number } }> | null => {
            if (Array.isArray(annotationData)) {
              return annotationData;
            }

            if (annotationData && typeof annotationData === "object") {
              const response = annotationData as AnnotationResponse;
              // Check for 'data' property first (new format)
              if (response.data && Array.isArray(response.data)) {
                return response.data;
              }
              // Check for 'annotation' property (legacy format)
              if (response.annotation && Array.isArray(response.annotation)) {
                return response.annotation;
              }
            }

            return null;
          };

          if (sourceSegmentationAnnotationId) {
            try {
              const sourceAnnotationData = await fetchAnnotation(
                sourceSegmentationAnnotationId
              );
              sourceSegmentation =
                extractSegmentationArray(sourceAnnotationData);
            } catch (error) {
              console.warn(
                "Failed to fetch source segmentation annotation:",
                error
              );
            }
          }

          if (targetSegmentationAnnotationId) {
            try {
              const targetAnnotationData = await fetchAnnotation(
                targetSegmentationAnnotationId
              );
              targetSegmentation =
                extractSegmentationArray(targetAnnotationData);
            } catch (error) {
              console.warn(
                "Failed to fetch target segmentation annotation:",
                error
              );
            }
          }

          // If no segmentation annotation found, try extracting from instance annotations
          sourceSegmentation ??= extractInstanceSegmentation(
            sourceInstanceData.annotations
          );
          targetSegmentation ??= extractInstanceSegmentation(
            targetInstanceData.annotations
          );

          // Get text content
          const sourceContent = sourceInstanceData.content || "";
          const targetContent = targetInstanceData.content || "";

          // Apply segmentation to text
          let segmentedSourceText: string;
          let segmentedTargetText: string;

          if (sourceSegmentation && sourceSegmentation.length > 0) {
            segmentedSourceText = applySegmentation(
              sourceContent,
              sourceSegmentation
            );
          } else {
            // Fallback to file segmentation if no instance segmentation
            const sourceSegmentations = generateFileSegmentation(sourceContent);
            segmentedSourceText = applySegmentation(
              sourceContent,
              sourceSegmentations
            );
          }

          if (targetSegmentation && targetSegmentation.length > 0) {
            segmentedTargetText = applySegmentation(
              targetContent,
              targetSegmentation
            );
          } else {
            // Fallback to file segmentation if no instance segmentation
            const targetSegmentations = generateFileSegmentation(targetContent);
            segmentedTargetText = applySegmentation(
              targetContent,
              targetSegmentations
            );
          }

          // Load the source and target on editor
          setSourceText(
            sourceTextId || sourceInstanceData.id || "source-instance",
            sourceInstanceId,
            segmentedSourceText,
            "database"
          );

          setTargetText(
            `related-${instanceId}`,
            instanceId,
            segmentedTargetText,
            "database"
          );

          setAnnotationsApplied(true);
          setLoadingAnnotations(false);

          // Update search params - only use t_id
          setSearchParams((prev) => {
            prev.set("t_id", instanceId);
            // Remove old params if they exist
            prev.delete("tTextId");
            prev.delete("tInstanceId");
            return prev;
          });

          setSelectedTargetInstanceId(instanceId);
        } catch (error) {
          console.error("Error processing segmentation:", error);
          setLoadingAnnotations(false);
          setAnnotationsApplied(true);
        }

        return;
      }
      if (hasAlignment) {
        // Get the annotation ID from related instances for the selected instance
        // Get the alignment annotation from fetchAnnotation
        // Apply the source and target alignment on source and target text
        // Load the source and target on editor

        if (!sourceInstanceId) {
          console.error("Source instance ID is required");
          return;
        }

        setLoadingAnnotations(true, "Fetching alignment annotation...");

        try {
          // Find the selected instance in related instances
          const selectedInstance = relatedInstances.find(
            (instance) => (instance.instance_id || instance.id) === instanceId
          );

          if (!selectedInstance) {
            console.error("Selected instance not found in related instances");
            setLoadingAnnotations(false);
            return;
          }

          // Get annotation ID from the selected instance
          let annotationId: string | null = null;
          if (
            "annotation" in selectedInstance &&
            typeof selectedInstance.annotation === "string"
          ) {
            annotationId = selectedInstance.annotation;
          } else if (
            Array.isArray(selectedInstance.annotations) &&
            selectedInstance.annotations[0]?.annotation_id
          ) {
            annotationId = selectedInstance.annotations[0].annotation_id;
          }

          if (!annotationId) {
            console.error(
              "No alignment annotation ID found for selected instance"
            );
            setLoadingAnnotations(false);
            return;
          }

          setSelectedAnnotationId(annotationId);

          // Fetch alignment annotation and both instances in parallel
          const [
            alignmentAnnotationData,
            sourceInstanceData,
            targetInstanceData,
          ] = await Promise.all([
            fetchAnnotation(annotationId),
            fetchInstance(sourceInstanceId),
            fetchInstance(instanceId),
          ]);

          // Extract alignment data from annotation response
          interface AlignmentAnnotationData {
            alignment_annotation: Array<{
              id: string;
              span: {
                start: number;
                end: number;
              };
              index: number;
              alignment_index: number[];
            }>;
            target_annotation: Array<{
              id: string;
              span: {
                start: number;
                end: number;
              };
              index: number;
            }>;
          }

          interface AlignmentAnnotationResponse {
            id: string;
            type: string;
            data: AlignmentAnnotationData;
          }

          const annotationData = (
            alignmentAnnotationData as unknown as AlignmentAnnotationResponse
          ).data;

          if (
            !annotationData?.target_annotation ||
            !Array.isArray(annotationData.target_annotation) ||
            !annotationData?.alignment_annotation ||
            !Array.isArray(annotationData.alignment_annotation)
          ) {
            console.error("Invalid alignment annotation structure");
            setLoadingAnnotations(false);
            return;
          }

          // Get text content
          const sourceContent = sourceInstanceData.content || "";
          const targetContent = targetInstanceData.content || "";

          // Reconstruct segments from alignment annotations
          const { source, target } = reconstructSegments(
            annotationData.target_annotation,
            annotationData.alignment_annotation,
            sourceContent,
            targetContent
          );

          // Join segments with newlines to create segmented text
          const segmentedSourceText = source.join("\n");
          const segmentedTargetText = target.join("\n");

          // Load the source and target on editor
          setSourceText(
            sourceTextId || sourceInstanceData.id || "source-instance",
            sourceInstanceId,
            segmentedSourceText,
            "database"
          );

          setTargetText(
            `related-${instanceId}`,
            instanceId,
            segmentedTargetText,
            "database"
          );

          setAnnotationsApplied(true);
          setLoadingAnnotations(false);

          // Update search params - only use t_id
          setSearchParams((prev) => {
            prev.set("t_id", instanceId);
            // Remove old params if they exist
            prev.delete("tTextId");
            prev.delete("tInstanceId");
            return prev;
          });

          setSelectedTargetInstanceId(instanceId);
        } catch (error) {
          console.error("Error processing alignment annotation:", error);
          setLoadingAnnotations(false);
          setAnnotationsApplied(true);
        }

        return;
      }

      // If it has alignment then do the current workflow
      const selectedInstance = relatedInstances.find(
        (instance) => (instance.instance_id || instance.id) === instanceId
      );

      if (selectedInstance) {
        let annotationId: string | null = null;
        if (
          "annotation" in selectedInstance &&
          typeof selectedInstance.annotation === "string"
        ) {
          annotationId = selectedInstance.annotation;
        } else if (
          Array.isArray(selectedInstance.annotations) &&
          selectedInstance.annotations[0]?.annotation_id
        ) {
          annotationId = selectedInstance.annotations[0].annotation_id;
        }
        setSelectedAnnotationId(annotationId);
      }

      setSelectedTargetInstanceId(instanceId);

      // Update search params - only use t_id
      setSearchParams((prev) => {
        prev.set("t_id", instanceId);
        // Remove old params if they exist
        prev.delete("tTextId");
        prev.delete("tInstanceId");
        return prev;
      });
    },
    [
      relatedInstances,
      setSearchParams,
      sourceInstanceId,
      sourceTextId,
      setSourceText,
      setTargetText,
      setLoadingAnnotations,
      setAnnotationsApplied,
    ]
  );

  // Load target after source is loaded and related instances are available
  React.useEffect(() => {
    const urlTargetId = searchParams.get("t_id");

    // Load target if t_id is present, source is loaded, and target isn't loaded yet
    if (
      urlTargetId &&
      sourceInstanceId &&
      !isTargetLoaded &&
      relatedInstances.length > 0 &&
      hasLoadedFromUrl
    ) {
      const targetInstance = relatedInstances.find(
        (instance) => (instance.instance_id || instance.id) === urlTargetId
      );

      if (targetInstance) {
        // Check if it has alignment annotation
        const annotationId =
          (
            targetInstance as {
              annotation?: string;
              annotations?: Array<{ annotation_id: string }>;
            }
          ).annotation || targetInstance.annotations?.[0]?.annotation_id;
        const hasAlignment = Boolean(annotationId);

        // Trigger target selection which will load the texts
        handleTargetInstanceSelection(urlTargetId, hasAlignment);

        if (annotationId) {
          setSelectedAnnotationId(annotationId);
        }
      }
    }
  }, [
    sourceInstanceId,
    searchParams,
    isTargetLoaded,
    relatedInstances,
    handleTargetInstanceSelection,
    hasLoadedFromUrl,
    setSelectedAnnotationId,
  ]);

  // Handle creating new text
  const handleCreateText = React.useCallback(() => {
    if (!selectedTextId) return;
    const selected = `${CATALOGER_URL}/create?t_Id=${selectedTextId}`;
    window.open(selected, "_blank");
  }, [selectedTextId]);

  // Handle creating text from BDRC ID
  const handleCreateTextFromBdrc = React.useCallback(() => {
    if (!selectedBdrcResult?.workId) return;
    const url = `${CATALOGER_URL}/create?t_id=${selectedBdrcResult.workId}`;
    window.open(url, "_blank");
  }, [selectedBdrcResult]);

  // Use alignment segmentation hook
  const {
    isLoadingAlignment,
    isLoadingSourceInstance,
    isLoadingTargetInstance,
    alignmentError,
  } = useAlignmentSegmentation({
    sourceInstanceId,
    sourceTextId,
    selectedTargetInstanceId,
    selectedAnnotationId,
    relatedInstances,
    onSearchParamsChange: () => {}, // Don't update search params automatically
  });

  // Get the text ID for selected BDRC result
  const selectedTextIdFromBdrc = React.useMemo(() => {
    if (!selectedBdrcResult?.workId) return null;
    const text = fetchedTexts.find((t) => t.bdrc === selectedBdrcResult.workId);
    return text?.id || null;
  }, [selectedBdrcResult, fetchedTexts]);

  const shouldShowBdrcSearch = !hasSelectedText || !selectedTextId;
  const shouldShowSelectedText = hasSelectedText && selectedTextId;
  const shouldShowInstanceSelector =
    hasSelectedText && selectedTextId && !isCheckingBdrcText;
  const shouldShowRelatedInstances =
    hasSelectedText &&
    selectedTextId &&
    !isCheckingBdrcText &&
    sourceInstanceId;

  return (
    <div className="h-full flex flex-col bg-gray-50 min-h-0">
      {/* Content */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
        {/* Left Side: Text and Instance Selection */}
        <div className="w-full md:w-1/2 h-full flex flex-col bg-white border-r border-gray-200 min-h-0 overflow-hidden">
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 z-10">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              <h2 className="text-lg font-semibold text-gray-900">
                Select Source Text & Instance
              </h2>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              Search for a text and choose an instance to align
            </p>
          </div>
          
          <div className="flex-1 px-6 py-6 space-y-6 overflow-y-auto min-h-0">
            {/* BDRC Search Panel */}
            {shouldShowBdrcSearch && (
              <BdrcSearchPanel
                bdrcSearchQuery={bdrcSearchQuery}
                setBdrcSearchQuery={setBdrcSearchQuery}
                showBdrcResults={showBdrcResults}
                setShowBdrcResults={setShowBdrcResults}
                bdrcTextNotFound={bdrcTextNotFound}
                isCheckingBdrcText={isCheckingBdrcText}
                selectedBdrcResult={selectedBdrcResult}
                onResultSelect={handleBdrcResultSelect}
                onCreateText={handleCreateTextFromBdrc}
              />
            )}

            {/* Selected Text Display */}
            {shouldShowSelectedText && (
              <SelectedTextDisplay
                selectedBdrcResult={selectedBdrcResult}
                textId={selectedTextIdFromBdrc}
                onReset={handleResetBdrcSelection}
              />
            )}

            {/* Instance Selector */}
            {shouldShowInstanceSelector && (
              <InstanceSelector
                selectedTextId={selectedTextId}
                selectedInstanceId={selectedInstanceId}
                availableInstances={availableInstances}
                isLoadingInstances={isLoadingInstances}
                isLoadingInstance={isLoadingInstance}
                instancesError={instancesError}
                instanceError={instanceError}
                onInstanceSelect={handleInstanceSelection}
                onCreateText={handleCreateText}
              />
            )}
          </div>
        </div>

        {/* Right Side: Related Instance Selection */}
        <div className="w-full md:w-1/2 h-full flex flex-col bg-white min-h-0 overflow-hidden">
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 z-10">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <h2 className="text-lg font-semibold text-gray-900">
                Select Related Instance
              </h2>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              Choose a translation or commentary to align with
            </p>
          </div>

          <div className="flex-1 px-6 py-6 overflow-y-auto min-h-0">
            {selectedInstanceId ? (
              <>
                {shouldShowRelatedInstances && (
                  <>
                    <RelatedInstancesPanel
                      sourceInstanceId={sourceInstanceId}
                      selectedTargetInstanceId={selectedTargetInstanceId}
                      onTargetInstanceSelect={handleTargetInstanceSelection}
                      onCreateTranslation={() =>
                        handleActionSelection("create-translation")
                      }
                      onCreateCommentary={() =>
                        handleActionSelection("create-commentary")
                      }
                    />

                    {/* Loading indicators */}
                    {(isLoadingAlignment ||
                      isLoadingSourceInstance ||
                      isLoadingTargetInstance) &&
                      selectedAnnotationId && (
                        <div className="mt-4 space-y-2">
                          {isLoadingAlignment && (
                            <div className="flex items-center space-x-2 text-sm text-blue-600">
                              <svg
                                className="animate-spin h-4 w-4 text-blue-500"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                              >
                                <circle
                                  className="opacity-25"
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  stroke="currentColor"
                                  strokeWidth="4"
                                ></circle>
                                <path
                                  className="opacity-75"
                                  fill="currentColor"
                                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                ></path>
                              </svg>
                              <span>Fetching alignment annotation...</span>
                            </div>
                          )}
                          {isLoadingSourceInstance && (
                            <div className="flex items-center space-x-2 text-sm text-blue-600">
                              <svg
                                className="animate-spin h-4 w-4 text-blue-500"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                              >
                                <circle
                                  className="opacity-25"
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  stroke="currentColor"
                                  strokeWidth="4"
                                ></circle>
                                <path
                                  className="opacity-75"
                                  fill="currentColor"
                                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                ></path>
                              </svg>
                              <span>Fetching source text content...</span>
                            </div>
                          )}
                          {isLoadingTargetInstance && (
                            <div className="flex items-center space-x-2 text-sm text-blue-600">
                              <svg
                                className="animate-spin h-4 w-4 text-blue-500"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                              >
                                <circle
                                  className="opacity-25"
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  stroke="currentColor"
                                  strokeWidth="4"
                                ></circle>
                                <path
                                  className="opacity-75"
                                  fill="currentColor"
                                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                ></path>
                              </svg>
                              <span>Fetching target text content...</span>
                            </div>
                          )}
                        </div>
                      )}

                    {alignmentError && (
                      <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
                        <p className="text-sm text-red-600">
                          Failed to load alignment annotation:{" "}
                          {alignmentError.message}
                        </p>
                      </div>
                    )}
                  </>
                )}
              </>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                    <svg
                      className="w-8 h-8 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-gray-900 mb-1">
                    Select a source instance first
                  </p>
                  <p className="text-xs text-gray-500">
                    Choose a text and instance on the left to see related instances here
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <LoadingOverlay
        isVisible={isLoadingAnnotations}
        message={loadingMessage || "Processing annotations..."}
      />
    </div>
  );
}

export default UnifiedSelectionPanel;
