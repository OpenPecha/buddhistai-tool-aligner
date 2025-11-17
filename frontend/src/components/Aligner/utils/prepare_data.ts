// get alignment data if given s_id and t_id;

import { fetchRelatedInstances } from "../../../api/instances";
import { fetchAnnotation, fetchInstance } from "../../../api/text";
import { populateMissingSpans, reverse_cleaned_alignments, addContentToAnnotations } from "./alignment_generator";

// Type for alignment annotation data structure
type AlignmentAnnotationData = {
    type: "alignment";
    target_annotation: Array<{
        id?: string | null;
        span: { start: number; end: number };
        index?: string;
    } | null>;
    alignment_annotation: Array<{
        id?: string | null;
        span: { start: number; end: number };
        index?: string;
        aligned_segments?: string[];
    } | null>;
};

async function prepareData(sourceInstanceId: string, targetInstanceId: string) {
    const sourceInstanceData = await fetchInstance(sourceInstanceId);
    const targetInstanceData = await fetchInstance(targetInstanceId);

    const relatedInstances = await fetchRelatedInstances(sourceInstanceId);

    const targetInstance = relatedInstances.find(instance => instance.instance_id === targetInstanceId);


    if(targetInstance?.annotation){
        const annotation = await fetchAnnotation(targetInstance?.annotation);
    
        const targetText=targetInstanceData.content || "";
        const sourceText=sourceInstanceData.content || "";
        
        // Type assertion for annotation.data - it should be AlignmentAnnotationData
        const annotationData = (annotation as { data?: AlignmentAnnotationData }).data;
        if (!annotationData || typeof annotationData !== 'object') {
            throw new Error('Invalid annotation data structure');
        }
        
        const reconstructed_annoations=reverse_cleaned_alignments(annotationData as Parameters<typeof reverse_cleaned_alignments>[0]);
        //get th text for each alignment segment from content
        console.log('reconstruct',reconstructed_annoations);
        
        const populated_annoations=populateMissingSpans(reconstructed_annoations);
        
        // Add content to each annotation based on spans
        const annotationsWithContent = addContentToAnnotations(
            populated_annoations,
            sourceText,
            targetText
        );
        console.log('annotationsWithContent',annotationsWithContent);
        
        return {
            source_text: sourceInstanceData.content,
            target_text: targetInstanceData.content,
            annotation: annotationsWithContent,
           has_alignment: true,
        };
    }
    else{
 
        const source_segmentation = sourceInstanceData.annotations && typeof sourceInstanceData.annotations === 'object'
        ? Object.values(sourceInstanceData.annotations)
            .flat()
            .find((ann: unknown): ann is { type?: string; annotation_id?: string } => 
              typeof ann === 'object' && ann !== null && 'type' in ann && (ann as { type?: string }).type === 'segmentation'
            )
        : undefined;

        const target_segmentation = targetInstanceData.annotations && typeof targetInstanceData.annotations === 'object'
        ? Object.values(targetInstanceData.annotations)
            .flat()
            .find((ann: unknown): ann is { type?: string; annotation_id?: string } => 
              typeof ann === 'object' && ann !== null && 'type' in ann && (ann as { type?: string }).type === 'segmentation'
            )
        : undefined;

        const source_segmentation_data = source_segmentation?.annotation_id 
            ? await fetchAnnotation(source_segmentation.annotation_id)
            : undefined;
        const target_segmentation_data = target_segmentation?.annotation_id
            ? await fetchAnnotation(target_segmentation.annotation_id)
            : undefined;

        return {
            source_text: sourceInstanceData.content,
            target_text: targetInstanceData.content,
            source_segmentation_data,
            target_segmentation_data,
            has_alignment: false,
        };
    }
}



export {prepareData}